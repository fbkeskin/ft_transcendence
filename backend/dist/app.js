"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/app.ts
const fastify_1 = __importDefault(require("fastify"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const multipart_1 = __importDefault(require("@fastify/multipart"));
const static_1 = __importDefault(require("@fastify/static"));
const path_1 = __importDefault(require("path"));
const auth_route_1 = require("./routes/auth.route");
require("./types/fastify");
const cors_1 = __importDefault(require("@fastify/cors"));
const swagger_1 = __importDefault(require("@fastify/swagger"));
const swagger_ui_1 = __importDefault(require("@fastify/swagger-ui"));
const game_route_1 = require("./routes/game.route"); // <--- İMPORT ET
const server = (0, fastify_1.default)({ logger: true });
// 1. CORS
server.register(cors_1.default, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
});
// 2. JWT
server.register(jwt_1.default, { secret: process.env.JWT_SECRET || 'gizli_anahtar' });
// 3. AUTHENTICATE DECORATOR
server.decorate("authenticate", async (request, reply) => {
    try {
        await request.jwtVerify();
    }
    catch (err) {
        reply.send(err);
    }
});
server.register(swagger_1.default, {
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
server.register(swagger_ui_1.default, {
    routePrefix: '/docs', // Tarayıcıdan gireceğimiz adres
    uiConfig: {
        docExpansion: 'list', // Sayfa açılınca listeyi açık tut
        deepLinking: false
    },
    staticCSP: false,
});
// 4. MULTIPART & STATIC
server.register(multipart_1.default, {
    limits: { fileSize: 5 * 1024 * 1024 }
});
server.register(static_1.default, {
    root: path_1.default.join(__dirname, '../uploads'),
    prefix: '/uploads/',
});
// --- DÜZELTME BURADA ---
// authRoutes içindeki yolların başına '/auth' ekliyoruz.
// Örn: route dosyasındaki '/42', artık '/auth/42' olacak.
server.register(auth_route_1.authRoutes, { prefix: '/auth' });
// -----------------------
server.get('/', async (req, reply) => { return reply.redirect('/docs'); });
server.get('/ping', async () => { return { status: 'OK', message: 'Pong!' }; });
server.register(game_route_1.gameRoutes, { prefix: '/game' });
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
