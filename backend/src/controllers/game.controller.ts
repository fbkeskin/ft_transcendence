// backend/src/controllers/game.controller.ts
import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../db'; // Veritabanı bağlantısı

interface UserPayload {
  id: number;
  email: string;
  username: string;
}

export const saveGame = async (req: FastifyRequest, reply: FastifyReply) => {
    // Frontend'den gelen 'opponentId'yi alıyoruz
    const { score1, score2, opponentId } = req.body as any;
    
    // JWT'den gelen aktif kullanıcı (Player 1)
    const userPayload = req.user as UserPayload;
    const player1Id = userPayload.id;

    try {
        const s1 = parseInt(score1);
        const s2 = parseInt(score2);

        // --- RAKİP ANALİZİ ---
        let player2Id: number | null = null;
        let guestName: string | null = null;

        // opponentId sayıya çevrilebiliyor mu?
        const parsedId = Number(opponentId);

        if (!isNaN(parsedId) && parsedId > 0) {
            // RAKİP GERÇEK BİR KULLANICI (Online Maç)
            player2Id = parsedId;
        } else {
            // RAKİP AI veya MİSAFİR (Local Maç)
            guestName = String(opponentId);
        }

        // --- KAZANAN BELİRLEME ---
        let winnerId: number | null = null;
        
        if (s1 > s2) {
            winnerId = player1Id; // Ben kazandım
        } else if (s2 > s1) {
            // Rakip kazandı. Eğer rakip gerçek kullanıcıysa onun ID'si, değilse NULL
            winnerId = player2Id ? player2Id : null;
        }

        // --- 1. OYUNU KAYDET ---
        const newGame = await prisma.game.create({
            data: {
                player1Id: player1Id,
                player2Id: player2Id, // Varsa ID, yoksa Null
                score1: s1,
                score2: s2,
                guestName: guestName, // Varsa İsim, yoksa Null
                winnerId: winnerId
            }
        });

        // --- 2. İSTATİSTİKLERİ GÜNCELLE (FONKSİYON) ---
        // Kod tekrarını önlemek için updateStats fonksiyonunu kullanacağız
        
        // Player 1 (Ben) Güncellemesi
        await updatePlayerStats(player1Id, s1 > s2);

        // Player 2 (Rakip) Güncellemesi (Eğer gerçek kullanıcıysa)
        if (player2Id) {
            await updatePlayerStats(player2Id, s2 > s1);
        }

        return reply.code(201).send(newGame);

    } catch (error) {
        console.error("Save Game Error:", error);
        return reply.code(500).send({ message: 'Oyun kaydedilemedi' });
    }
};

// --- YARDIMCI FONKSİYON: İSTATİSTİK GÜNCELLEME ---
async function updatePlayerStats(userId: number, isWinner: boolean) {
    if (isWinner) {
        // Kazandıysa: Galibiyet artır, level kontrol et
        const user = await prisma.user.update({
            where: { id: userId },
            data: { wins: { increment: 1 } }
        });

        // Level mantığı: Her 5 galibiyette 1 level
        const newLevel = Math.floor(user.wins / 5);
        if (newLevel > user.level) {
            await prisma.user.update({
                where: { id: userId },
                data: { level: newLevel }
            });
        }
    } else {
        // Kaybettiyse: Mağlubiyet artır
        await prisma.user.update({
            where: { id: userId },
            data: { losses: { increment: 1 } }
        });
    }
}