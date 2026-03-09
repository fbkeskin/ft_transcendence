// src/controllers/auth.controller.ts
import { FastifyReply, FastifyRequest } from 'fastify';
import { registerUser, loginUser } from '../services/auth.service';
import fs from 'fs';
import { unlink } from 'fs/promises';
import util from 'util';
import { pipeline } from 'stream';
import axios from 'axios';
import qrcode from 'qrcode';
import { prisma } from '../db'; 
import { updateOnlineUsername, onlineUsers } from '../socket/store';

const { authenticator } = require('otplib');
authenticator.options = { window: 1 };
const pump = util.promisify(pipeline);

// --- TİP TANIMLARI ---
interface RegisterBody { Body: { email: string; username: string; password: string; } }
interface LoginBody { Body: { email: string; password: string; } }
interface Verify2FABody { Body: { userId: number; code: string; } }
interface UserPayload { id: number; email: string; username: string; }

export const register = async (request: FastifyRequest<RegisterBody>, reply: FastifyReply) => {
  try {
    const { email, username, password } = request.body;
    const newUser = await registerUser(email, username, password);
    return reply.code(201).send({ message: 'USER_CREATED', user: newUser });
  } catch (error: any) {
    return reply.code(409).send({ message: 'EMAIL_OR_USERNAME_TAKEN' });
  }
};

export const login = async (request: FastifyRequest<LoginBody>, reply: FastifyReply) => {
  const { email, password } = request.body;
  const result = await loginUser(email, password, request.server.jwt);
  if (!result) return reply.code(401).send({ message: 'INVALID_CREDENTIALS' });
  const user = await prisma.user.findUnique({ where: { email } });
  if (user && user.isTwoFactorEnabled) {
    return reply.send({ message: '2FA_REQUIRED', require2FA: true, userId: user.id });
  }
  return reply.send({ message: 'LOGIN_SUCCESS', token: result.token });
};

export const verify2FALogin = async (req: FastifyRequest<Verify2FABody>, reply: FastifyReply) => {
    try {
        const { userId, code } = req.body;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret) return reply.status(400).send({ message: 'INVALID_REQUEST' });
        if (!code || String(code).length !== 6) return reply.status(400).send({ message: 'INVALID_CODE_FORMAT' });
        let isValid = false;
        try { isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret }); } 
        catch (err) { return reply.status(400).send({ message: 'INVALID_CODE_FORMAT' }); }
        if (!isValid) return reply.status(401).send({ message: 'INVALID_2FA_CODE' });
        const token = req.server.jwt.sign({ id: user.id, email: user.email, username: user.username });
        return reply.send({ message: 'LOGIN_SUCCESS', token });
    } catch (err) { return reply.status(401).send({ message: 'INVALID_CODE_FORMAT' }); }
};

export const updateAvatar = async (request: FastifyRequest, reply: FastifyReply) => {
    const userPayload = request.user as UserPayload;
    const data = await request.file();
    if (!data) return reply.code(400).send({ message: 'Dosya yüklenmedi' });
    const user = await prisma.user.findUnique({ where: { id: userPayload.id } });
    if (user?.avatar && user.avatar !== 'default.png') {
      try { if (fs.existsSync(`./uploads/${user.avatar}`)) await unlink(`./uploads/${user.avatar}`); } catch (err) {}
    }
    const fileName = `${userPayload.id}_${data.filename}`;
    await pump(data.file, fs.createWriteStream(`./uploads/${fileName}`));
    await prisma.user.update({ where: { id: userPayload.id }, data: { avatar: fileName } });
    return reply.send({ message: 'Avatar güncellendi', url: `/uploads/${fileName}` });
};

export const me = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userPayload = request.user as UserPayload;
      const user = await prisma.user.findUnique({
        where: { id: userPayload.id },
        include: {
          gamesAsPlayer1: { include: { player2: true, winner: true }, take: 15, orderBy: { createdAt: 'desc' } },
          gamesAsPlayer2: { include: { player1: true, winner: true }, take: 15, orderBy: { createdAt: 'desc' } }
        }
      });
      if (!user) return reply.code(404).send({ message: 'Kullanıcı bulunamadı' });
      const { password, twoFactorSecret, ...safeUser } = user;
      return reply.send({ user: safeUser });
    } catch (error) { return reply.code(500).send({ message: 'SERVER_ERROR' }); }
};

export const login42 = async (req: FastifyRequest, reply: FastifyReply) => {
    const authorizationUrl = `https://api.intra.42.fr/oauth/authorize?client_id=${process.env.FORTYTWO_CLIENT_ID}&redirect_uri=${process.env.FORTYTWO_CALLBACK_URL}&response_type=code`;
    return reply.redirect(authorizationUrl);
};

export const callback42 = async (req: FastifyRequest<{ Querystring: { code: string } }>, reply: FastifyReply) => {
    const code = req.query.code;
    if (!code) return reply.code(400).send({ message: 'Kod yok' });
  
    try {
      const tokenResponse = await axios.post('https://api.intra.42.fr/oauth/token', {
        grant_type: 'authorization_code',
        client_id: process.env.FORTYTWO_CLIENT_ID,
        client_secret: process.env.FORTYTWO_CLIENT_SECRET,
        code: code,
        redirect_uri: process.env.FORTYTWO_CALLBACK_URL,
      });
  
      const userResponse = await axios.get('https://api.intra.42.fr/v2/me', {
        headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` },
      });
      const fortyTwoUser = userResponse.data;
      const avatarUrl = fortyTwoUser.image?.link || 'default.png';

      let user = await prisma.user.findUnique({ where: { email: fortyTwoUser.email } });
  
      if (!user) {
        let newUsername = fortyTwoUser.login;
        const checkUsername = await prisma.user.findUnique({ where: { username: newUsername } });
        if (checkUsername) newUsername = `${fortyTwoUser.login}_42_${Math.floor(Math.random() * 1000)}`;
  
        user = await prisma.user.create({
          data: {
            email: fortyTwoUser.email,
            username: newUsername,
            password: '', 
            avatar: avatarUrl,
          }
        });
      }
  
      if (user.isTwoFactorEnabled) {
          return reply.redirect(`/login?userId=${user.id}&2fa_required=true`);
      }

      const token = req.server.jwt.sign({ id: user.id, email: user.email, username: user.username });
      return reply.redirect(`/login?token=${token}`);
  
    } catch (error) {
      console.error('42 Auth Hatası:', error);
      return reply.redirect('/login?error=42_auth_failed');
    }
};

export const generate2FA = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const userPayload = req.user as UserPayload;
      const user = await prisma.user.findUnique({ where: { id: userPayload.id } });
      if (!user) return reply.code(404).send({message: 'User not found'});
      const secret = authenticator.generateSecret();
      await prisma.user.update({ where: { id: user.id }, data: { twoFactorSecret: secret } });
      const otpauth = `otpauth://totp/FT_TRANSCENDENCE:${user.email}?secret=${secret}&issuer=FT_TRANSCENDENCE&algorithm=SHA1&digits=6&period=30`;
      const imageUrl = await qrcode.toDataURL(otpauth);
      return reply.send({ qrCodeUrl: imageUrl, secret: secret });
    } catch (error) { return reply.status(500).send({ message: 'QR_GENERATE_ERROR' }); }
};
  
export const turnOn2FA = async (req: FastifyRequest<{ Body: { code: string } }>, reply: FastifyReply) => {
    const { code } = req.body;
    const userPayload = req.user as UserPayload;
    try {
      const user = await prisma.user.findUnique({ where: { id: userPayload.id } });
      if (!user || !user.twoFactorSecret) return reply.status(400).send({ message: 'SETUP_REQUIRED' });
      if (!code || String(code).length !== 6) return reply.status(400).send({ message: 'INVALID_CODE_FORMAT' });
      let isValid = false;
      try { isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret }); } 
      catch (err) { return reply.status(400).send({ message: 'INVALID_CODE_FORMAT' }); }
      if (!isValid) return reply.status(401).send({ message: 'INVALID_2FA_CODE' });
      await prisma.user.update({ where: { id: user.id }, data: { isTwoFactorEnabled: true } });
      return reply.send({ message: '2FA_ENABLED_SUCCESS' });
    } catch (error) { return reply.status(400).send({ message: 'INVALID_CODE_FORMAT' }); }
};

export const disable2FA = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        const userPayload = req.user as UserPayload;
        await prisma.user.update({
            where: { id: userPayload.id },
            data: { isTwoFactorEnabled: false, twoFactorSecret: null }
        });
        return reply.send({ message: '2FA_DISABLED_SUCCESS' });
    } catch (error) {
        return reply.status(500).send({ message: 'DISABLE_2FA_ERROR' });
    }
};

export const updateProfile = async (req: FastifyRequest<{ Body: { username: string } }>, reply: FastifyReply) => {
    try {
        const userPayload = req.user as UserPayload;
        const { username } = req.body;

        if (!username || username.length < 3 || username.length > 12) {
            return reply.status(400).send({ message: 'INVALID_USERNAME_LENGTH' });
        }

        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(username)) {
            return reply.status(400).send({ message: 'INVALID_USERNAME_CHARS' });
        }

        const existing = await prisma.user.findUnique({ where: { username } });
        if (existing && existing.id !== userPayload.id) {
            return reply.status(409).send({ message: 'USERNAME_TAKEN' });
        }

        await prisma.user.update({
            where: { id: userPayload.id },
            data: { username }
        });

        // --- SOCKET SENKRONİZASYONU ---
        updateOnlineUsername(userPayload.id, username);
        const io = (req.server as any).io;
        if (io) {
            // 1. Tüm lobiyi (online listesini) yeni isimle tekrar yayınla
            const list = Array.from(onlineUsers.entries()).map(([id, u]: [number, any]) => ({ 
                id, 
                username: u.username, 
                status: u.status 
            }));
            io.emit('online_users_list', list);
            
            // 2. Arkadaş listelerini yenilemeleri için sinyal gönder
            io.emit('user_list_updated');
        }
        // ------------------------------

        return reply.send({ message: 'PROFILE_UPDATED_SUCCESS' });
    } catch (error) {
        return reply.status(500).send({ message: 'UPDATE_PROFILE_ERROR' });
    }
};