// backend/src/routes/tournament.route.ts
import { FastifyInstance } from 'fastify';
import { createTournament, getUserTournaments } from '../controllers/tournament.controller';

export async function tournamentRoutes(server: FastifyInstance) {
    // Tüm endpointler için giriş yapma zorunluluğu
    server.addHook('preHandler', async (request) => {
        await request.jwtVerify();
    });

    server.post('/create', createTournament); // Turnuva bittiğinde çağrılır
    server.get('/history', getUserTournaments); // Profilde göstermek için
}