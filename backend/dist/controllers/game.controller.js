"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveGame = void 0;
const db_1 = require("../db");
const saveGame = async (req, reply) => {
    const { score1, score2, opponentName, type } = req.body;
    const userId = req.user.id; // Token'dan gelen senin ID'n
    try {
        // Kazananı belirle
        // Eğer sen (P1) kazandıysan winnerId senin ID'n olur.
        // Eğer AI/Guest kazandıysa winnerId NULL olur (veya null bırakırız).
        let winnerId = null;
        if (score1 > score2)
            winnerId = userId;
        // Eğer rakip kayıtlı bir user olsaydı onun id'sini atardık.
        const newGame = await db_1.prisma.game.create({
            data: {
                player1Id: userId,
                score1: parseInt(score1),
                score2: parseInt(score2),
                guestName: opponentName || "Guest", // "Yapay Zeka" veya "Misafir"
                winnerId: winnerId
                // player2Id BOŞ kalacak çünkü AI/Guest kayıtlı değil
            }
        });
        // İstatistikleri Güncelle (Wins/Losses)
        if (score1 > score2) {
            await db_1.prisma.user.update({
                where: { id: userId },
                data: { wins: { increment: 1 }, level: { increment: 1 } } // Kazanırsa level atlar
            });
        }
        else {
            await db_1.prisma.user.update({
                where: { id: userId },
                data: { losses: { increment: 1 } }
            });
        }
        return reply.code(201).send(newGame);
    }
    catch (error) {
        console.error(error);
        return reply.code(500).send({ message: 'Oyun kaydedilemedi' });
    }
};
exports.saveGame = saveGame;
