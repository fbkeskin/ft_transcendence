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
            // 1. Galibiyet sayısını artır ve güncel veriyi al
            const updatedUser = await db_1.prisma.user.update({
                where: { id: userId },
                data: { wins: { increment: 1 } }
            });
            // 2. Yeni Level Hesapla: Her 5 galibiyette 1 level
            const newLevel = Math.floor(updatedUser.wins / 5);
            // 3. Eğer level atlaması gerekiyorsa güncelle
            if (newLevel > updatedUser.level) {
                await db_1.prisma.user.update({
                    where: { id: userId },
                    data: { level: newLevel }
                });
            }
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
