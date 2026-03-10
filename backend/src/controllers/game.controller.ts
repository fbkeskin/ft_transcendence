// backend/src/controllers/game.controller.ts
import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../db'; 

interface UserPayload {
  id: number;
  email: string;
  username: string;
}

export const saveGame = async (req: FastifyRequest, reply: FastifyReply) => {
    const { score1, score2, opponentId } = req.body as any;
    
    const userPayload = req.user as UserPayload;
    const player1Id = userPayload.id;

    try {
        const s1 = parseInt(score1);
        const s2 = parseInt(score2);

        // --- RAKİP ANALİZİ ---
        let player2Id: number | null = null;
        let guestName: string | null = null;

        const parsedId = Number(opponentId);

        if (!isNaN(parsedId) && parsedId > 0) {
            player2Id = parsedId;
        } else {
            guestName = String(opponentId);
        }

        // --- KAZANAN BELİRLEME ---
        let winnerId: number | null = null;
        
        if (s1 > s2) {
            winnerId = player1Id; 
        } else if (s2 > s1) {
            winnerId = player2Id ? player2Id : null;
        }

        // --- 1. OYUNU KAYDET ---
        const newGame = await prisma.game.create({
            data: {
                player1Id: player1Id,
                player2Id: player2Id, 
                score1: s1,
                score2: s2,
                guestName: guestName, 
                winnerId: winnerId
            }
        });
        
        await updatePlayerStats(player1Id, s1 > s2);

        if (player2Id) {
            await updatePlayerStats(player2Id, s2 > s1);
        }

        return reply.code(201).send(newGame);

    } catch (error) {
        console.error("Save Game Error:", error);
        return reply.code(500).send({ message: 'Oyun kaydedilemedi' });
    }
};

async function updatePlayerStats(userId: number, isWinner: boolean) {
    if (isWinner) {
        const user = await prisma.user.update({
            where: { id: userId },
            data: { wins: { increment: 1 } }
        });

        const newLevel = Math.floor(user.wins / 5);
        if (newLevel > user.level) {
            await prisma.user.update({
                where: { id: userId },
                data: { level: newLevel }
            });
        }
    } else {
        await prisma.user.update({
            where: { id: userId },
            data: { losses: { increment: 1 } }
        });
    }
}