"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gameRoutes = gameRoutes;
const game_controller_1 = require("../controllers/game.controller");
async function gameRoutes(server) {
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
    }, game_controller_1.saveGame);
}
