// src/app.ts
import fastify, { FastifyReply, FastifyRequest } from 'fastify';
import fjwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { authRoutes } from './routes/auth.route';
import './types/fastify';
import cors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { gameRoutes } from './routes/game.route'; // <--- İMPORT ET

const server = fastify({ logger: true });

// 1. CORS
server.register(cors, {
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE']
});

// 2. JWT
server.register(fjwt, { secret: process.env.JWT_SECRET || 'gizli_anahtar' });

// 3. AUTHENTICATE DECORATOR
server.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
});

server.register(fastifySwagger, {
  swagger: {
    info: {
      title: 'FT_TRANSCENDENCE API',
      description: 'Pong Oyunu Backend API Dokümantasyonu',
      version: '1.0.0'
    },
    host: 'localhost:3000',
    schemes: ['http'],
    consumes: ['application/json'],
    produces: ['application/json'],
    securityDefinitions: {
      apiKey: {
        type: 'apiKey',
        name: 'Authorization',
        in: 'header'
      }
    }
  }
});

server.register(fastifySwaggerUi, {
  routePrefix: '/docs', // Tarayıcıdan gireceğimiz adres
  uiConfig: {
    docExpansion: 'list', // Sayfa açılınca listeyi açık tut
    deepLinking: false
  },
  staticCSP: false,
});

// 4. MULTIPART & STATIC
server.register(multipart, {
    limits: { fileSize: 5 * 1024 * 1024 }
});
  
server.register(fastifyStatic, {
    root: path.join(__dirname, '../uploads'),
    prefix: '/uploads/',
});

// --- DÜZELTME BURADA ---
// authRoutes içindeki yolların başına '/auth' ekliyoruz.
// Örn: route dosyasındaki '/42', artık '/auth/42' olacak.
server.register(authRoutes, { prefix: '/auth' });
// -----------------------
server.get('/', async (req, reply) => { return reply.redirect('/docs'); });
server.get('/ping', async () => { return { status: 'OK', message: 'Pong!' }; });
server.register(gameRoutes, { prefix: '/game' });

const start = async () => {
  try {
    await server.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server running at http://localhost:3000');
  } 
  catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();