// backend/src/routes/tournament.route.ts
import { FastifyInstance } from 'fastify';
import { createTournament, getUserTournaments } from '../controllers/tournament.controller';

export async function tournamentRoutes(server: FastifyInstance) {
    server.addHook('preHandler', async (request) => {
        await request.jwtVerify();
    });

    server.post('/create', createTournament); 
    server.get('/history', getUserTournaments);
}