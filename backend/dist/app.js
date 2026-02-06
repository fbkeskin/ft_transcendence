"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/app.ts
const fastify_1 = __importDefault(require("fastify"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const cookie_1 = __importDefault(require("@fastify/cookie"));
const multipart_1 = __importDefault(require("@fastify/multipart"));
const static_1 = __importDefault(require("@fastify/static"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("@fastify/cors"));
const swagger_1 = require("@fastify/swagger");
const swagger_ui_1 = require("@fastify/swagger-ui");
// --- SOCKET IMPORTLARI ---
const fastify_socket_io_1 = __importDefault(require("fastify-socket.io"));
// -------------------------
const auth_route_1 = require("./routes/auth.route");
const game_route_1 = require("./routes/game.route");
// -------------------------------------
const server = (0, fastify_1.default)();
// 1. JWT, Cookie, Multipart, Static, Swagger
server.register(cors_1.default, {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true
});
server.register(jwt_1.default, { secret: 'supersecret' });
server.register(cookie_1.default);
server.register(multipart_1.default);
server.register(static_1.default, {
    root: path_1.default.join(__dirname, '../uploads'),
    prefix: '/uploads/',
});
server.register(swagger_1.fastifySwagger, {
    swagger: {
        info: { title: 'Ft_Transcendence API', version: '1.0.0' },
        securityDefinitions: { apiKey: { type: 'apiKey', name: 'Authorization', in: 'header' } }
    }
});
server.register(swagger_ui_1.fastifySwaggerUi, { routePrefix: '/docs' });
// --- 2. SOCKET.IO AYARLARI ---
server.register(fastify_socket_io_1.default, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    }
});
// --- 3. AUTHENTICATE DECORATOR (JWT KONTROLÜ) ---
// Bu kısım olmazsa 'server.authenticate' fonksiyonu çalışmaz.
server.decorate("authenticate", async (request, reply) => {
    try {
        await request.jwtVerify();
    }
    catch (err) {
        reply.send(err);
    }
});
// ------------------------------------------------
// 4. Rotalar
server.register(auth_route_1.authRoutes, { prefix: '/auth' });
server.register(game_route_1.gameRoutes, { prefix: '/game' });
// --- 5. SOCKET BAĞLANTI DİNLEYİCİSİ ---
server.ready(err => {
    if (err)
        throw err;
    // (server as any).io diyerek TS kontrolünü aşıyoruz.
    server.io.on('connection', (socket) => {
        console.log('🔌 SOCKET: Bir kullanıcı bağlandı! ID:', socket.id);
        // Bağlantı koptuğunda
        socket.on('disconnect', () => {
            console.log('❌ SOCKET: Kullanıcı ayrıldı. ID:', socket.id);
        });
        // Test Ping'i
        socket.on('ping', () => {
            console.log(`📡 Frontend (ID: ${socket.id}) PING attı!`);
            socket.emit('pong', { message: 'Backend: PONG! Bağlantı süper.' });
        });
    });
});
// ----------------------------------------
const start = async () => {
    try {
        await server.listen({ port: 3000, host: '0.0.0.0' });
        console.log('Sunucu 3000 portunda çalışıyor 🚀');
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
start();
