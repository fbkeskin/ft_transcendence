// backend/src/controllers/friend.controller.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../db';
import { getSocketId } from '../socket/store'; 

interface UserPayload { id: number; username: string; } 

// 1. Arkadaş Ekleme İsteği
export const sendFriendRequest = async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.user as UserPayload;
    const { receiverId } = req.body as { receiverId: number };

    if (user.id === Number(receiverId)) return reply.code(400).send({ message: "Kendini ekleyemezsin!" });

    const existing = await prisma.friendship.findFirst({
        where: {
            OR: [
                { senderId: user.id, receiverId: Number(receiverId) },
                { senderId: Number(receiverId), receiverId: user.id }
            ]
        }
    });

    if (existing) {
        return reply.code(400).send({ message: "Zaten istek gönderilmiş veya arkadaşsınız." });
    }

    await prisma.friendship.create({
        data: { senderId: user.id, receiverId: Number(receiverId), status: "PENDING" }
    });

    // --- SOCKET BİLDİRİMİ ---
    const io = (req.server as any).io;
    const targetSocketId = getSocketId(Number(receiverId));
    const mySocketId = getSocketId(user.id);
    
    if (targetSocketId) {
        io.to(targetSocketId).emit('friend_request', {
            senderId: user.id,
            senderName: user.username 
        });
    }
    if (mySocketId) io.to(mySocketId).emit('friend_list_update');

    return reply.send({ message: "İstek gönderildi" });
};

// 2. İsteği Kabul Et
export const acceptFriendRequest = async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.user as UserPayload;
    const { senderId } = req.body as { senderId: number };

    await prisma.friendship.updateMany({
        where: { senderId: Number(senderId), receiverId: user.id, status: "PENDING" },
        data: { status: "ACCEPTED" }
    });

    // --- SOCKET BİLDİRİMİ ---
    const io = (req.server as any).io;
    const targetSocketId = getSocketId(Number(senderId));
    const mySocketId = getSocketId(user.id);

    if (targetSocketId) {
        io.to(targetSocketId).emit('friend_accepted', {
            accepterId: user.id,
            accepterName: user.username
        });
    }
    if (mySocketId) io.to(mySocketId).emit('friend_list_update');

    return reply.send({ message: "Arkadaşlık kabul edildi!" });
};

// 3. Arkadaşı Sil veya İsteği Reddet
export const removeFriend = async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.user as UserPayload;
    const { targetId } = req.body as { targetId: number }; 

    await prisma.friendship.deleteMany({
        where: {
            OR: [
                { senderId: user.id, receiverId: Number(targetId) },
                { senderId: Number(targetId), receiverId: user.id }
            ]
        }
    });

    // --- SOCKET BİLDİRİMİ ---
    const io = (req.server as any).io;
    const targetSocketId = getSocketId(Number(targetId));
    const mySocketId = getSocketId(user.id);
    
    if (targetSocketId) io.to(targetSocketId).emit('friend_list_update');
    if (mySocketId) io.to(mySocketId).emit('friend_list_update');

    return reply.send({ message: "Arkadaş silindi." });
};

// 4. Arkadaş Listesini Getir
export const getFriends = async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.user as UserPayload;

    const friends = await prisma.friendship.findMany({
        where: {
            OR: [{ senderId: user.id }, { receiverId: user.id }],
            status: "ACCEPTED"
        },
        include: { sender: true, receiver: true }
    });

    const formattedFriends = friends.map(f => {
        return (f.senderId === user.id) ? f.receiver : f.sender;
    });

    return reply.send(formattedFriends);
};

// 5. Bekleyen İstekleri Getir
export const getPendingRequests = async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.user as UserPayload;

    const requests = await prisma.friendship.findMany({
        where: { receiverId: user.id, status: "PENDING" },
        include: { sender: true }
    });

    return reply.send(requests.map(r => r.sender));
};