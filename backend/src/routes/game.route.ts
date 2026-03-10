// backend/src/routes/game.route.ts
import { FastifyInstance } from 'fastify';
import { saveGame } from '../controllers/game.controller';

export async function gameRoutes(server: FastifyInstance) {
    server.post('/save', {
        onRequest: [server.authenticate],
        schema: {
            tags: ['Game'],
            body: {
                type: 'object',
                required: ['score1', 'score2', 'opponentId'],
                properties: {
                    score1: { type: 'number' },
                    score2: { type: 'number' },
                    opponentId: { 
                        anyOf: [
                            { type: 'number' }, 
                            { type: 'string' }
                        ] 
                    }
                }
            }
        }
    }, saveGame);
}