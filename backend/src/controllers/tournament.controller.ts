// backend/src/controllers/tournament.controller.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../db';

interface UserPayload {
  id: number;
}

export const createTournament = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        const user = req.user as UserPayload;
        const { players, winner } = req.body as any; 

        // 1. Turnuvayı Kaydet
        const tournament = await prisma.tournament.create({
            data: {
                userId: user.id,
                player1: players[0],
                player2: players[1],
                player3: players[2],
                player4: players[3],
                winner: winner
            }
        });

        console.log(`🏆 Turnuva Kaydedildi! Düzenleyen: ID ${user.id}, Şampiyon: ${winner}`);

        return reply.code(201).send(tournament);

    } catch (error) {
        console.error("Turnuva kayıt hatası:", error);
        return reply.code(500).send({ message: 'Turnuva kaydedilemedi' });
    }
};

export const getUserTournaments = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
        const user = req.user as UserPayload;
        
        const tournaments = await prisma.tournament.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        });

        return reply.send(tournaments);
    } catch (error) {
        return reply.code(500).send({ message: 'Veri çekilemedi' });
    }
};