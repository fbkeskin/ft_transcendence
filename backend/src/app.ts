// backend/src/app.ts
import fastify, { FastifyReply, FastifyRequest } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';
import cors from '@fastify/cors';
import { fastifySwagger } from '@fastify/swagger';
import { fastifySwaggerUi } from '@fastify/swagger-ui';
import { handleSocket } from './socket/socket.handler';
import { tournamentRoutes } from './routes/tournament.route';
import { friendRoutes } from './routes/friend.route';

// --- SOCKET IMPORTLARI ---
import socketioServer from 'fastify-socket.io';
import { Socket } from 'socket.io'; 
// -------------------------

import { authRoutes } from './routes/auth.route';
import { gameRoutes } from './routes/game.route';

// TİP TANIMLAMASI
declare module "fastify" {
  export interface FastifyInstance {
    authenticate: any; 
  }
}

// --- DÜZELTME BURADA: LOGGER'I AÇIYORUZ ---
const server = fastify({ 
  logger: true 
});
// ------------------------------------------

// 1. Eklentiler
server.register(cors, { 
  // DİKKAT 1: Nginx ve farklı IP'ler için origin'i dinamik (true) yaptık.
  // Bu sayede tarayıcı hangi IP'den gelirse gelsin CORS hatası vermeyecek.
  origin: true, 
  credentials: true 
});

server.register(fastifyJwt, { secret: 'supersecret' });
server.register(fastifyCookie);
server.register(fastifyMultipart);
server.register(fastifyStatic, {
  root: path.join(__dirname, '../uploads'),
  prefix: '/uploads/',
});

server.register(fastifySwagger, {
  swagger: {
    info: { title: 'Ft_Transcendence API', version: '1.0.0' },
    securityDefinitions: { apiKey: { type: 'apiKey', name: 'Authorization', in: 'header' } }
  }
});
server.register(fastifySwaggerUi, { routePrefix: '/docs' });

// 2. Socket.io
server.register(socketioServer, {
  cors: {
    // DİKKAT 2: Socket.io CORS ayarını da dinamik yaptık.
    origin: true,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// 3. Authenticate Decorator
server.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

// 4. Rotalar
server.register(authRoutes, { prefix: '/auth' });
server.register(gameRoutes, { prefix: '/game' });
server.register(tournamentRoutes, { prefix: '/tournament' });
server.register(friendRoutes, { prefix: '/friends' });

// --- YENİ: ANA SAYFAYI SWAGGER'A YÖNLENDİR ---
server.get('/', (req, reply) => {
    return reply.redirect('/docs');
});

// 5. Socket Logic
server.ready(err => {
    if (err) throw err;
    handleSocket(server);
});

const start = async () => {
  try {
    // 0.0.0.0 Docker için çok önemli (Bu zaten doğruydu, dokunmadık)
    await server.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Sunucu 3000 portunda çalışıyor 🚀');
  } catch (err) {
    server.log.error(err);
    console.error("KRİTİK HATA:", err); 
    process.exit(1);
  }
};
start();