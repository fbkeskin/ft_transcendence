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
                // opponentId zorunlu alan
                required: ['score1', 'score2', 'opponentId'],
                properties: {
                    score1: { type: 'number' },
                    score2: { type: 'number' },
                    // DÜZELTME: opponentId hem sayı (ID) hem string (GuestName) olabilir.
                    opponentId: {
                        anyOf: [
                            { type: 'number' },
                            { type: 'string' }
                        ]
                    }
                }
            }
        }
    }, game_controller_1.saveGame);
}
