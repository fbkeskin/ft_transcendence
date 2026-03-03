"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.disable2FA = exports.turnOn2FA = exports.generate2FA = exports.callback42 = exports.login42 = exports.me = exports.updateAvatar = exports.verify2FALogin = exports.login = exports.register = void 0;
const auth_service_1 = require("../services/auth.service");
const fs_1 = __importDefault(require("fs"));
const promises_1 = require("fs/promises");
const util_1 = __importDefault(require("util"));
const stream_1 = require("stream");
const axios_1 = __importDefault(require("axios"));
const qrcode_1 = __importDefault(require("qrcode"));
const db_1 = require("../db");
const store_1 = require("../socket/store");
const { authenticator } = require('otplib');
authenticator.options = { window: 1 };
const pump = util_1.default.promisify(stream_1.pipeline);
const register = async (request, reply) => {
    try {
        const { email, username, password } = request.body;
        const newUser = await (0, auth_service_1.registerUser)(email, username, password);
        return reply.code(201).send({ message: 'USER_CREATED', user: newUser });
    }
    catch (error) {
        return reply.code(409).send({ message: 'EMAIL_OR_USERNAME_TAKEN' });
    }
};
exports.register = register;
const login = async (request, reply) => {
    const { email, password } = request.body;
    const result = await (0, auth_service_1.loginUser)(email, password, request.server.jwt);
    if (!result)
        return reply.code(401).send({ message: 'INVALID_CREDENTIALS' });
    const user = await db_1.prisma.user.findUnique({ where: { email } });
    if (user && user.isTwoFactorEnabled) {
        return reply.send({ message: '2FA_REQUIRED', require2FA: true, userId: user.id });
    }
    return reply.send({ message: 'LOGIN_SUCCESS', token: result.token });
};
exports.login = login;
const verify2FALogin = async (req, reply) => {
    try {
        const { userId, code } = req.body;
        const user = await db_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret)
            return reply.status(400).send({ message: 'INVALID_REQUEST' });
        if (!code || String(code).length !== 6)
            return reply.status(400).send({ message: 'INVALID_CODE_FORMAT' });
        let isValid = false;
        try {
            isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret });
        }
        catch (err) {
            return reply.status(400).send({ message: 'INVALID_CODE_FORMAT' });
        }
        if (!isValid)
            return reply.status(401).send({ message: 'INVALID_2FA_CODE' });
        const token = req.server.jwt.sign({ id: user.id, email: user.email, username: user.username });
        return reply.send({ message: 'LOGIN_SUCCESS', token });
    }
    catch (err) {
        return reply.status(401).send({ message: 'INVALID_CODE_FORMAT' });
    }
};
exports.verify2FALogin = verify2FALogin;
const updateAvatar = async (request, reply) => {
    const userPayload = request.user;
    const data = await request.file();
    if (!data)
        return reply.code(400).send({ message: 'Dosya yüklenmedi' });
    const user = await db_1.prisma.user.findUnique({ where: { id: userPayload.id } });
    if (user?.avatar && user.avatar !== 'default.png') {
        try {
            if (fs_1.default.existsSync(`./uploads/${user.avatar}`))
                await (0, promises_1.unlink)(`./uploads/${user.avatar}`);
        }
        catch (err) { }
    }
    const fileName = `${userPayload.id}_${data.filename}`;
    await pump(data.file, fs_1.default.createWriteStream(`./uploads/${fileName}`));
    await db_1.prisma.user.update({ where: { id: userPayload.id }, data: { avatar: fileName } });
    return reply.send({ message: 'Avatar güncellendi', url: `/uploads/${fileName}` });
};
exports.updateAvatar = updateAvatar;
const me = async (request, reply) => {
    try {
        const userPayload = request.user;
        const user = await db_1.prisma.user.findUnique({
            where: { id: userPayload.id },
            include: {
                gamesAsPlayer1: { include: { player2: true, winner: true }, take: 15, orderBy: { createdAt: 'desc' } },
                gamesAsPlayer2: { include: { player1: true, winner: true }, take: 15, orderBy: { createdAt: 'desc' } }
            }
        });
        if (!user)
            return reply.code(404).send({ message: 'Kullanıcı bulunamadı' });
        const { password, twoFactorSecret, ...safeUser } = user;
        return reply.send({ user: safeUser });
    }
    catch (error) {
        return reply.code(500).send({ message: 'SERVER_ERROR' });
    }
};
exports.me = me;
const login42 = async (req, reply) => {
    const authorizationUrl = `https://api.intra.42.fr/oauth/authorize?client_id=${process.env.FORTYTWO_CLIENT_ID}&redirect_uri=${process.env.FORTYTWO_CALLBACK_URL}&response_type=code`;
    return reply.redirect(authorizationUrl);
};
exports.login42 = login42;
const callback42 = async (req, reply) => {
    const code = req.query.code;
    if (!code)
        return reply.code(400).send({ message: 'Kod yok' });
    try {
        const tokenResponse = await axios_1.default.post('https://api.intra.42.fr/oauth/token', {
            grant_type: 'authorization_code',
            client_id: process.env.FORTYTWO_CLIENT_ID,
            client_secret: process.env.FORTYTWO_CLIENT_SECRET,
            code: code,
            redirect_uri: process.env.FORTYTWO_CALLBACK_URL,
        });
        const userResponse = await axios_1.default.get('https://api.intra.42.fr/v2/me', {
            headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` },
        });
        const fortyTwoUser = userResponse.data;
        const avatarUrl = fortyTwoUser.image?.link || 'default.png';
        let user = await db_1.prisma.user.findUnique({ where: { email: fortyTwoUser.email } });
        if (!user) {
            let newUsername = fortyTwoUser.login;
            const checkUsername = await db_1.prisma.user.findUnique({ where: { username: newUsername } });
            if (checkUsername)
                newUsername = `${fortyTwoUser.login}_42_${Math.floor(Math.random() * 1000)}`;
            user = await db_1.prisma.user.create({
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
    }
    catch (error) {
        console.error('42 Auth Hatası:', error);
        return reply.redirect('/login?error=42_auth_failed');
    }
};
exports.callback42 = callback42;
const generate2FA = async (req, reply) => {
    try {
        const userPayload = req.user;
        const user = await db_1.prisma.user.findUnique({ where: { id: userPayload.id } });
        if (!user)
            return reply.code(404).send({ message: 'User not found' });
        const secret = authenticator.generateSecret();
        await db_1.prisma.user.update({ where: { id: user.id }, data: { twoFactorSecret: secret } });
        const otpauth = `otpauth://totp/FT_TRANSCENDENCE:${user.email}?secret=${secret}&issuer=FT_TRANSCENDENCE&algorithm=SHA1&digits=6&period=30`;
        const imageUrl = await qrcode_1.default.toDataURL(otpauth);
        return reply.send({ qrCodeUrl: imageUrl });
    }
    catch (error) {
        return reply.status(500).send({ message: 'QR_GENERATE_ERROR' });
    }
};
exports.generate2FA = generate2FA;
const turnOn2FA = async (req, reply) => {
    const { code } = req.body;
    const userPayload = req.user;
    try {
        const user = await db_1.prisma.user.findUnique({ where: { id: userPayload.id } });
        if (!user || !user.twoFactorSecret)
            return reply.status(400).send({ message: 'SETUP_REQUIRED' });
        if (!code || String(code).length !== 6)
            return reply.status(400).send({ message: 'INVALID_CODE_FORMAT' });
        let isValid = false;
        try {
            isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret });
        }
        catch (err) {
            return reply.status(400).send({ message: 'INVALID_CODE_FORMAT' });
        }
        if (!isValid)
            return reply.status(401).send({ message: 'INVALID_2FA_CODE' });
        await db_1.prisma.user.update({ where: { id: user.id }, data: { isTwoFactorEnabled: true } });
        return reply.send({ message: '2FA_ENABLED_SUCCESS' });
    }
    catch (error) {
        return reply.status(400).send({ message: 'INVALID_CODE_FORMAT' });
    }
};
exports.turnOn2FA = turnOn2FA;
const disable2FA = async (req, reply) => {
    try {
        const userPayload = req.user;
        await db_1.prisma.user.update({
            where: { id: userPayload.id },
            data: { isTwoFactorEnabled: false, twoFactorSecret: null }
        });
        return reply.send({ message: '2FA_DISABLED_SUCCESS' });
    }
    catch (error) {
        return reply.status(500).send({ message: 'DISABLE_2FA_ERROR' });
    }
};
exports.disable2FA = disable2FA;
const updateProfile = async (req, reply) => {
    try {
        const userPayload = req.user;
        const { username } = req.body;
        if (!username || username.length < 3 || username.length > 12) {
            return reply.status(400).send({ message: 'INVALID_USERNAME_LENGTH' });
        }
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(username)) {
            return reply.status(400).send({ message: 'INVALID_USERNAME_CHARS' });
        }
        const existing = await db_1.prisma.user.findUnique({ where: { username } });
        if (existing && existing.id !== userPayload.id) {
            return reply.status(409).send({ message: 'USERNAME_TAKEN' });
        }
        await db_1.prisma.user.update({
            where: { id: userPayload.id },
            data: { username }
        });
        // --- SOCKET SENKRONİZASYONU ---
        (0, store_1.updateOnlineUsername)(userPayload.id, username);
        const io = req.server.io;
        if (io) {
            // 1. Tüm lobiyi (online listesini) yeni isimle tekrar yayınla
            const list = Array.from(onlineUsers.entries()).map(([id, u]) => ({
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
    }
    catch (error) {
        return reply.status(500).send({ message: 'UPDATE_PROFILE_ERROR' });
    }
};
exports.updateProfile = updateProfile;
