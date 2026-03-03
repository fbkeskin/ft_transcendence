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
const socket_handler_1 = require("./socket/socket.handler");
const tournament_route_1 = require("./routes/tournament.route");
const friend_route_1 = require("./routes/friend.route");
// --- SOCKET IMPORTLARI ---
const fastify_socket_io_1 = __importDefault(require("fastify-socket.io"));
// -------------------------
const auth_route_1 = require("./routes/auth.route");
const game_route_1 = require("./routes/game.route");
// --- DÜZELTME BURADA: LOGGER'I AÇIYORUZ ---
const server = (0, fastify_1.default)({
    logger: true
});
// ------------------------------------------
// 1. Eklentiler
server.register(cors_1.default, {
    // DİKKAT 1: Nginx ve farklı IP'ler için origin'i dinamik (true) yaptık.
    // Bu sayede tarayıcı hangi IP'den gelirse gelsin CORS hatası vermeyecek.
    origin: true,
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
// 2. Socket.io
server.register(fastify_socket_io_1.default, {
    cors: {
        // DİKKAT 2: Socket.io CORS ayarını da dinamik yaptık.
        origin: true,
        methods: ["GET", "POST"],
        credentials: true
    }
});
// 3. Authenticate Decorator
server.decorate("authenticate", async (request, reply) => {
    try {
        await request.jwtVerify();
    }
    catch (err) {
        reply.send(err);
    }
});
// 4. Rotalar
server.register(auth_route_1.authRoutes, { prefix: '/auth' });
server.register(game_route_1.gameRoutes, { prefix: '/game' });
server.register(tournament_route_1.tournamentRoutes, { prefix: '/tournament' });
server.register(friend_route_1.friendRoutes, { prefix: '/friends' });
// --- YENİ: ANA SAYFAYI SWAGGER'A YÖNLENDİR ---
server.get('/', (req, reply) => {
    return reply.redirect('/docs');
});
// 5. Socket Logic
server.ready(err => {
    if (err)
        throw err;
    (0, socket_handler_1.handleSocket)(server);
});
const start = async () => {
    try {
        // 0.0.0.0 Docker için çok önemli (Bu zaten doğruydu, dokunmadık)
        await server.listen({ port: 3000, host: '0.0.0.0' });
        console.log('Sunucu 3000 portunda çalışıyor 🚀');
    }
    catch (err) {
        server.log.error(err);
        console.error("KRİTİK HATA:", err);
        process.exit(1);
    }
};
start();
