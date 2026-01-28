// backend/src/routes/game.route.ts
import { FastifyInstance } from 'fastify';
import { saveGame } from '../controllers/game.controller';

export async function gameRoutes(server: FastifyInstance) {
    server.post('/save', {
        onRequest: [server.authenticate], // Sadece giriş yapmış kullanıcılar
        schema: {
            tags: ['Game'],
            body: {
                type: 'object',
                required: ['score1', 'score2', 'opponentName'],
                properties: {
                    score1: { type: 'number' },
                    score2: { type: 'number' },
                    opponentName: { type: 'string' }
                }
            }
        }
    }, saveGame);
}