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

    // Karşı taraftan bize gelen bekleyen bir istek var mı kontrol et
    const reversePending = await prisma.friendship.findFirst({
        where: { senderId: Number(receiverId), receiverId: user.id, status: "PENDING" }
    });

    if (reversePending) {
        // Karşılıklı istek! Arkadaşlığı otomatik kabul et.
        await prisma.friendship.update({
            where: { id: reversePending.id },
            data: { status: "ACCEPTED" }
        });

        // Socket bildirimi: SADECE KARŞI TARAFA GÖNDER (Çünkü biz zaten API yanıtıyla Modal göreceğiz)
        const io = (req.server as any).io;
        const targetSocketId = getSocketId(Number(receiverId));
        const mySocketId = getSocketId(user.id);
        if (targetSocketId) io.to(targetSocketId).emit('friend_accepted', { accepterId: user.id, accepterName: user.username, isMutual: true });
        if (targetSocketId) io.to(targetSocketId).emit('friend_list_update');
        if (mySocketId) io.to(mySocketId).emit('friend_list_update');

        return reply.send({ message: "FRIEND_ACCEPTED_MUTUAL" });
    }

    const existing = await prisma.friendship.findFirst({
        where: {
            OR: [
                { senderId: user.id, receiverId: Number(receiverId) },
                { senderId: Number(receiverId), receiverId: user.id }
            ]
        }
    });

    if (existing) {
        return reply.code(400).send({ message: "FRIEND_REQUEST_ALREADY_SENT" });
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
            accepterName: user.username,
            isMutual: false
        });
        io.to(targetSocketId).emit('friend_list_update');
    }
    if (mySocketId) io.to(mySocketId).emit('friend_list_update');

    return reply.send({ message: "Arkadaşlık kabul edildi!" });
};

// 3. Arkadaşı Sil veya İsteği Reddet
export const removeFriend = async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.user as UserPayload;
    const { targetId } = req.body as { targetId: number }; 

    // Önce kaydı bulalım ki durumunu (PENDING mi ACCEPTED mı) görelim
    const existing = await prisma.friendship.findFirst({
        where: {
            OR: [
                { senderId: user.id, receiverId: Number(targetId) },
                { senderId: Number(targetId), receiverId: user.id }
            ]
        }
    });

    if (!existing) return reply.send({ message: "Kayıt bulunamadı." });

    const isPending = existing.status === "PENDING";

    await prisma.friendship.delete({
        where: { id: existing.id }
    });

    // --- SOCKET BİLDİRİMİ ---
    const io = (req.server as any).io;
    const targetSocketId = getSocketId(Number(targetId));
    const mySocketId = getSocketId(user.id);
    
    if (targetSocketId) {
        // Sadece bekleyen bir istek reddedildiyse veya iptal edildiyse bildirim gönder
        if (isPending) {
            const amISender = existing.senderId === user.id;
            if (amISender) {
                // Ben göndericiyim, isteğimi iptal ediyorum
                io.to(targetSocketId).emit('friend_request_cancelled', { senderId: user.id });
            } else {
                // Ben alıcıyım, gelen isteği reddediyorum
                io.to(targetSocketId).emit('friend_rejected', { rejecterId: user.id, rejecterName: user.username });
            }
        }
        io.to(targetSocketId).emit('friend_list_update');
    }
    if (mySocketId) io.to(mySocketId).emit('friend_list_update');

    return reply.send({ message: "İşlem başarılı." });
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