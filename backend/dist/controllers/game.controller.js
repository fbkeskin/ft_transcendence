"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveGame = void 0;
const db_1 = require("../db");
const saveGame = async (req, reply) => {
    const { score1, score2, opponentName } = req.body;
    // --- DÜZELTME BURADA ---
    // req.user'ı 'UserPayload' olarak zorluyoruz (Type Casting)
    const userPayload = req.user;
    const userId = userPayload.id;
    // -----------------------
    try {
        // Kazananı belirle
        // Eğer sen (P1) kazandıysan winnerId senin ID'n olur.
        // Eğer AI/Guest kazandıysa winnerId NULL olur.
        let winnerId = null;
        // Gelen veriler string olabilir, garantiye almak için parseInt yapıyoruz
        const s1 = parseInt(score1);
        const s2 = parseInt(score2);
        if (s1 > s2)
            winnerId = userId;
        const newGame = await db_1.prisma.game.create({
            data: {
                player1Id: userId,
                score1: s1,
                score2: s2,
                guestName: opponentName || "Guest",
                winnerId: winnerId
                // player2Id BOŞ kalacak çünkü AI/Guest kayıtlı değil
            }
        });
        // İstatistikleri Güncelle (Wins/Losses)
        if (s1 > s2) {
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
