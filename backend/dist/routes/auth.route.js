"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = authRoutes;
const auth_controller_1 = require("../controllers/auth.controller");
async function authRoutes(server) {
    // 1. REGISTER (Kayıt Ol)
    // Swagger'a diyoruz ki: "Bana email, username ve password lazım."
    server.post('/register', {
        schema: {
            description: 'Yeni kullanıcı kaydı oluşturur',
            tags: ['Auth'], // Swagger'da "Auth" başlığı altında toplar
            body: {
                type: 'object',
                required: ['email', 'username', 'password'],
                properties: {
                    email: { type: 'string', format: 'email' },
                    username: { type: 'string' },
                    password: { type: 'string' }
                }
            }
        }
    }, auth_controller_1.register);
    // 2. LOGIN (Giriş Yap)
    // Swagger'a diyoruz ki: "Bana email ve password lazım."
    server.post('/login', {
        schema: {
            description: 'Kullanıcı girişi yapar ve Token döner',
            tags: ['Auth'],
            body: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', format: 'email', default: 'test@test.com' },
                    password: { type: 'string', default: '123456' }
                }
            }
        }
    }, auth_controller_1.login);
    // 3. ME (Profilim) - Body gerekmez, sadece Header(Token) gerekir.
    server.get('/me', {
        onRequest: [server.authenticate],
        schema: {
            description: 'Giriş yapmış kullanıcının bilgilerini getirir',
            tags: ['Auth'],
            security: [{ apiKey: [] }] // Swagger'da kilit simgesi ister
        }
    }, auth_controller_1.me);
    // 4. AVATAR YÜKLEME
    server.post('/avatar', {
        onRequest: [server.authenticate],
        schema: {
            tags: ['Auth'],
            security: [{ apiKey: [] }]
        }
    }, auth_controller_1.updateAvatar);
    // 42 AUTH ROTALARI
    server.get('/42', { schema: { tags: ['Auth'] } }, auth_controller_1.login42);
    server.get('/42/callback', { schema: { tags: ['Auth'] } }, auth_controller_1.callback42);
    // 2FA İŞLEMLERİ
    server.post('/2fa/generate', {
        onRequest: [server.authenticate],
        schema: { tags: ['Auth'], security: [{ apiKey: [] }] }
    }, auth_controller_1.generate2FA);
    server.post('/2fa/turn-on', {
        onRequest: [server.authenticate],
        schema: {
            tags: ['Auth'],
            security: [{ apiKey: [] }],
            body: {
                type: 'object',
                properties: { code: { type: 'string' } }
            }
        }
    }, auth_controller_1.turnOn2FA);
    // 5. 2FA VERIFY (Login olurken)
    server.post('/2fa/verify', {
        schema: {
            description: 'Login aşamasında 2FA kodunu doğrular',
            tags: ['Auth'],
            body: {
                type: 'object',
                required: ['userId', 'code'],
                properties: {
                    userId: { type: 'number' },
                    code: { type: 'string' }
                }
            }
        }
    }, auth_controller_1.verify2FALogin);
}
