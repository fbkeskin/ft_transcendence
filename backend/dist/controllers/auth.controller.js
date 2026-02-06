"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.turnOn2FA = exports.generate2FA = exports.callback42 = exports.login42 = exports.me = exports.updateAvatar = exports.verify2FALogin = exports.login = exports.register = void 0;
const auth_service_1 = require("../services/auth.service");
const fs_1 = __importDefault(require("fs"));
const promises_1 = require("fs/promises");
const util_1 = __importDefault(require("util"));
const stream_1 = require("stream");
const axios_1 = __importDefault(require("axios"));
const qrcode_1 = __importDefault(require("qrcode"));
const db_1 = require("../db");
// "require" kullanarak TypeScript hatasından kaçınıyoruz
const { authenticator } = require('otplib');
// Mac/Docker saat farkı toleransı
authenticator.options = { window: 1 };
const pump = util_1.default.promisify(stream_1.pipeline);
// ----------------------------------------------------------------
// 1. REGISTER
// ----------------------------------------------------------------
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
// ----------------------------------------------------------------
// 2. LOGIN
// ----------------------------------------------------------------
const login = async (request, reply) => {
    const { email, password } = request.body;
    const result = await (0, auth_service_1.loginUser)(email, password, request.server.jwt);
    if (!result)
        return reply.code(401).send({ message: 'INVALID_CREDENTIALS' });
    const user = await db_1.prisma.user.findUnique({ where: { email } });
    if (user && user.isTwoFactorEnabled) {
        return reply.send({
            message: '2FA_REQUIRED',
            require2FA: true,
            userId: user.id
        });
    }
    return reply.send({ message: 'LOGIN_SUCCESS', token: result.token });
};
exports.login = login;
// ----------------------------------------------------------------
// 3. 2FA VERIFY LOGIN
// ----------------------------------------------------------------
const verify2FALogin = async (req, reply) => {
    try {
        const { userId, code } = req.body;
        const user = await db_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret) {
            return reply.status(400).send({ message: 'INVALID_REQUEST' });
        }
        if (!code || String(code).length !== 6) {
            return reply.status(400).send({ message: 'INVALID_CODE_FORMAT' });
        }
        let isValid = false;
        try {
            isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret });
        }
        catch (err) {
            return reply.status(400).send({ message: 'INVALID_CODE_FORMAT' });
        }
        if (!isValid) {
            return reply.status(401).send({ message: 'INVALID_2FA_CODE' });
        }
        const token = req.server.jwt.sign({
            id: user.id, email: user.email, username: user.username,
        });
        return reply.send({ message: 'LOGIN_SUCCESS', token });
    }
    catch (err) {
        console.error("2FA Verify Hatası:", err);
        return reply.status(401).send({ message: 'INVALID_CODE_FORMAT' });
    }
};
exports.verify2FALogin = verify2FALogin;
// ----------------------------------------------------------------
// 4. AVATAR UPDATE
// ----------------------------------------------------------------
const updateAvatar = async (request, reply) => {
    // TİP DÜZELTMESİ: request.user'ı UserPayload olarak görüyoruz
    const userPayload = request.user;
    const data = await request.file();
    if (!data)
        return reply.code(400).send({ message: 'Dosya yüklenmedi' });
    const user = await db_1.prisma.user.findUnique({ where: { id: userPayload.id } });
    if (user?.avatar && user.avatar !== 'default.png') {
        try {
            await (0, promises_1.unlink)(`./uploads/${user.avatar}`);
        }
        catch (err) { }
    }
    const fileName = `${userPayload.id}_${data.filename}`;
    await pump(data.file, fs_1.default.createWriteStream(`./uploads/${fileName}`));
    await db_1.prisma.user.update({
        where: { id: userPayload.id },
        data: { avatar: fileName }
    });
    return reply.send({ message: 'Avatar güncellendi', url: `/uploads/${fileName}` });
};
exports.updateAvatar = updateAvatar;
// ----------------------------------------------------------------
// 5. ME
// ----------------------------------------------------------------
const me = async (request, reply) => {
    try {
        // TİP DÜZELTMESİ: request.user'ı UserPayload olarak görüyoruz
        const userPayload = request.user;
        const user = await db_1.prisma.user.findUnique({
            where: { id: userPayload.id },
            include: {
                gamesAsPlayer1: {
                    include: { player2: true, winner: true },
                    take: 15,
                    orderBy: { createdAt: 'desc' }
                },
                gamesAsPlayer2: {
                    include: { player1: true, winner: true },
                    take: 15,
                    orderBy: { createdAt: 'desc' }
                }
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
// ----------------------------------------------------------------
// 6. 42 AUTH
// ----------------------------------------------------------------
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
            return reply.redirect(`http://localhost:5173/login?userId=${user.id}&2fa_required=true`);
        }
        const token = req.server.jwt.sign({ id: user.id, email: user.email, username: user.username });
        return reply.redirect(`http://localhost:5173/login?token=${token}`);
    }
    catch (error) {
        console.error('42 Auth Hatası:', error);
        return reply.redirect('http://localhost:5173/login?error=42_auth_failed');
    }
};
exports.callback42 = callback42;
// ----------------------------------------------------------------
// 7. 2FA SETUP
// ----------------------------------------------------------------
const generate2FA = async (req, reply) => {
    try {
        // TİP DÜZELTMESİ
        const userPayload = req.user;
        const user = await db_1.prisma.user.findUnique({ where: { id: userPayload.id } });
        if (!user)
            return reply.code(404).send({ message: 'User not found' });
        const secret = authenticator.generateSecret();
        console.log('📝 Yeni Secret:', secret);
        await db_1.prisma.user.update({
            where: { id: user.id },
            data: { twoFactorSecret: secret }
        });
        const otpauth = `otpauth://totp/FT_TRANSCENDENCE:${user.email}?secret=${secret}&issuer=FT_TRANSCENDENCE&algorithm=SHA1&digits=6&period=30`;
        const imageUrl = await qrcode_1.default.toDataURL(otpauth);
        return reply.send({ qrCodeUrl: imageUrl });
    }
    catch (error) {
        console.error('🔥 2FA Generate Hatası:', error);
        return reply.status(500).send({ message: 'QR_GENERATE_ERROR' });
    }
};
exports.generate2FA = generate2FA;
const turnOn2FA = async (req, reply) => {
    const { code } = req.body;
    // TİP DÜZELTMESİ
    const userPayload = req.user;
    try {
        const user = await db_1.prisma.user.findUnique({ where: { id: userPayload.id } });
        console.log('🔍 2FA Açma İsteği:', {
            userId: userPayload.id,
            codeGelen: code,
            secretVarMi: !!user?.twoFactorSecret
        });
        if (!user || !user.twoFactorSecret) {
            return reply.status(400).send({ message: 'SETUP_REQUIRED' });
        }
        if (!code || String(code).length !== 6) {
            return reply.status(400).send({ message: 'INVALID_CODE_FORMAT' });
        }
        let isValid = false;
        try {
            isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret });
        }
        catch (err) {
            console.error("2FA Verify Token Error:", err);
            return reply.status(400).send({ message: 'INVALID_CODE_FORMAT' });
        }
        if (!isValid) {
            return reply.status(401).send({ message: 'INVALID_2FA_CODE' });
        }
        await db_1.prisma.user.update({ where: { id: user.id }, data: { isTwoFactorEnabled: true } });
        return reply.send({ message: '2FA_ENABLED_SUCCESS' });
    }
    catch (error) {
        console.error('🔥 2FA TurnOn Hatası:', error);
        return reply.status(400).send({ message: 'INVALID_CODE_FORMAT' });
    }
};
exports.turnOn2FA = turnOn2FA;
