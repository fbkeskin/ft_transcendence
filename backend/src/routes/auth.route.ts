// src/routes/auth.route.ts
import { FastifyInstance } from 'fastify';
import { register, login, me, updateAvatar, login42, callback42, generate2FA, turnOn2FA, verify2FALogin } from '../controllers/auth.controller';

export async function authRoutes(server: FastifyInstance) {
  
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
  }, register);

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
  }, login);

  // 3. ME (Profilim) - Body gerekmez, sadece Header(Token) gerekir.
  server.get('/me', { 
    onRequest: [server.authenticate],
    schema: {
        description: 'Giriş yapmış kullanıcının bilgilerini getirir',
        tags: ['Auth'],
        security: [{ apiKey: [] }] // Swagger'da kilit simgesi ister
    }
  }, me);

  // 4. AVATAR YÜKLEME
  server.post('/avatar', { 
    onRequest: [server.authenticate],
    schema: {
        tags: ['Auth'],
        security: [{ apiKey: [] }]
    }
  }, updateAvatar);

  // 42 AUTH ROTALARI
  server.get('/42', { schema: { tags: ['Auth'] } }, login42); 
  server.get('/42/callback', { schema: { tags: ['Auth'] } }, callback42); 

  // 2FA İŞLEMLERİ
  server.post('/2fa/generate', { 
    onRequest: [server.authenticate],
    schema: { tags: ['Auth'], security: [{ apiKey: [] }] }
  }, generate2FA);

  server.post('/2fa/turn-on',  { 
    onRequest: [server.authenticate],
    schema: {
        tags: ['Auth'],
        security: [{ apiKey: [] }],
        body: {
            type: 'object',
            properties: { code: { type: 'string' } }
        }
    }
  }, turnOn2FA);
  
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
  }, verify2FALogin);
}