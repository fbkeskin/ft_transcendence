// src/controllers/auth.controller.ts
import { FastifyReply, FastifyRequest } from 'fastify';
import { registerUser, loginUser } from '../services/auth.service';
import fs from 'fs';
import { unlink } from 'fs/promises';
import util from 'util';
import { pipeline } from 'stream';
import axios from 'axios';
import qrcode from 'qrcode';

// --- DÜZELTME BURADA ---
// Artık PrismaClient'ı buradan çağırmıyoruz.
// Merkezi db.ts dosyasından hazır 'prisma' nesnesini alıyoruz.
import { prisma } from '../db'; 
const otplib = require('otplib');

const pump = util.promisify(pipeline);

// --- DÜZELTME BURADA ---
// const prisma = new PrismaClient();  <-- BU SATIRI SİLDİK!
// Çünkü yukarıda import { prisma } from '../db' diyerek zaten aldık.
// -----------------------

// TİP TANIMLARI
interface RegisterBody {
  Body: { email: string; username: string; password: string; }
}
interface LoginBody {
  Body: { email: string; password: string; }
}
interface Verify2FABody { 
  Body: { userId: number; code: string; } 
}

// ----------------------------------------------------------------
// 1. REGISTER
// ----------------------------------------------------------------
export const register = async (request: FastifyRequest<RegisterBody>, reply: FastifyReply) => {
  try {
    const { email, username, password } = request.body;
    const newUser = await registerUser(email, username, password);
    return reply.code(201).send({ message: 'Kullanici olusturuldu', user: newUser });
  } catch (error: any) {
    return reply.code(409).send({ message: 'Email veya kullanici adi kullanimda' });
  }
};

// ----------------------------------------------------------------
// 2. LOGIN
// ----------------------------------------------------------------
export const login = async (request: FastifyRequest<LoginBody>, reply: FastifyReply) => {
  const { email, password } = request.body;
  const result = await loginUser(email, password, request.server.jwt);

  if (!result) return reply.code(401).send({ message: 'Hatali giris' });

  const user = await prisma.user.findUnique({ where: { email } });

  if (user && user.isTwoFactorEnabled) {
    return reply.send({ 
      message: '2FA Kodu Gerekli', 
      require2FA: true, 
      userId: user.id 
    });
  }

  return reply.send({ message: 'Giris basarili', token: result.token });
};

// ----------------------------------------------------------------
// 3. 2FA VERIFY LOGIN
// ----------------------------------------------------------------
export const verify2FALogin = async (req: FastifyRequest<Verify2FABody>, reply: FastifyReply) => {
    const { userId, code } = req.body;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret) {
        return reply.status(400).send({ message: 'Geçersiz istek' });
    }

    // otplib.verify({ token, secret }) formatı kullanılır
    const isValid = otplib.verify({ token: code, secret: user.twoFactorSecret });
    
    if (!isValid) {
        return reply.status(401).send({ message: 'Hatalı 2FA kodu' });
    }

    const token = req.server.jwt.sign({
        id: user.id, email: user.email, username: user.username,
    });
    return reply.send({ message: 'Giriş Başarılı', token });
};

// ----------------------------------------------------------------
// 4. AVATAR UPDATE
// ----------------------------------------------------------------
export const updateAvatar = async (request: FastifyRequest, reply: FastifyReply) => {
    const data = await request.file();
    if (!data) return reply.code(400).send({ message: 'Dosya yüklenmedi' });
  
    const user = await prisma.user.findUnique({ where: { id: request.user.id } });
    if (user?.avatar && user.avatar !== 'default.png') {
      try { await unlink(`./uploads/${user.avatar}`); } catch (err) {}
    }
  
    const fileName = `${request.user.id}_${data.filename}`;
    await pump(data.file, fs.createWriteStream(`./uploads/${fileName}`));
  
    await prisma.user.update({
      where: { id: request.user.id },
      data: { avatar: fileName }
    });
  
    return reply.send({ message: 'Avatar güncellendi', url: `/uploads/${fileName}` });
};

// ----------------------------------------------------------------
// 5. ME
// ----------------------------------------------------------------
export const me = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: request.user.id },
        include: {
          gamesAsPlayer1: {
            include: { player2: true, winner: true },
            take: 5,
            orderBy: { createdAt: 'desc' }
          },
          gamesAsPlayer2: {
            include: { player1: true, winner: true },
            take: 5,
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!user) return reply.code(404).send({ message: 'Kullanıcı bulunamadı' });
      
      const { password, twoFactorSecret, ...safeUser } = user;
      
      return reply.send({ user: safeUser });
    } catch (error) {
      return reply.code(500).send({ message: 'Sunucu hatası' });
    }
};

// ----------------------------------------------------------------
// 6. 42 AUTH
// ----------------------------------------------------------------
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
          return reply.redirect(`http://localhost:5173/login?userId=${user.id}&2fa_required=true`);
      }

      const token = req.server.jwt.sign({ id: user.id, email: user.email, username: user.username });
      return reply.redirect(`http://localhost:5173/login?token=${token}`);
  
    } catch (error) {
      console.error('42 Auth Hatası:', error);
      return reply.redirect('http://localhost:5173/login?error=42_auth_failed');
    }
};

// ----------------------------------------------------------------
// 7. 2FA SETUP (GENERATE & TURN ON)
// ----------------------------------------------------------------
export const generate2FA = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const userJwt = req.user as any;
      const user = await prisma.user.findUnique({ where: { id: userJwt.id } });
      if (!user) return reply.code(404).send({message: 'User not found'});

      const secret = otplib.generateSecret();
      console.log('📝 Yeni Secret:', secret);

      await prisma.user.update({
        where: { id: user.id },
        data: { twoFactorSecret: secret }
      });
  
      const otpauth = `otpauth://totp/FT_TRANSCENDENCE:${user.email}?secret=${secret}&issuer=FT_TRANSCENDENCE&algorithm=SHA1&digits=6&period=30`;
      const imageUrl = await qrcode.toDataURL(otpauth);
  
      return reply.send({ qrCodeUrl: imageUrl });
    } catch (error) {
      console.error('🔥 2FA Generate Hatası:', error);
      return reply.status(500).send({ message: 'QR Kod hatası' });
    }
};
  
export const turnOn2FA = async (req: FastifyRequest<{ Body: { code: string } }>, reply: FastifyReply) => {
    const { code } = req.body;
    const userJwt = req.user as any;
  
    try {
      const user = await prisma.user.findUnique({ where: { id: userJwt.id } });

      console.log('🔍 2FA Açma İsteği:', { 
          userId: userJwt.id, 
          codeGelen: code,
          secretVarMi: !!user?.twoFactorSecret
      });

      if (!user || !user.twoFactorSecret) {
          return reply.status(400).send({ message: 'Lütfen önce Setup yapın.' });
      }

      const isValid = otplib.verify({ token: code, secret: user.twoFactorSecret });

      if (!isValid) {
          return reply.status(401).send({ message: 'Girdiğiniz kod yanlış veya süresi dolmuş.' });
      }
  
      await prisma.user.update({ where: { id: user.id }, data: { isTwoFactorEnabled: true } });
      return reply.send({ message: '2FA Başarıyla Aktif Edildi! 🛡️' });

    } catch (error) {
      console.error('🔥 2FA TurnOn Hatası:', error);
      return reply.status(500).send({ message: 'Sunucu hatası.' });
    }
};