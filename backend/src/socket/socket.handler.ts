// backend/src/socket/socket.handler.ts
import { FastifyInstance } from 'fastify';
import { Socket } from 'socket.io';
// Store'dan hem listeyi hem de tipi alıyoruz
import { onlineUsers, OnlineUser } from './store'; 

export const handleSocket = (server: FastifyInstance) => {
  
  (server as any).io.on('connection', async (socket: Socket) => {
    let userId: number;
    let username: string;

    try {
      const token = socket.handshake.auth.token;
      if (!token) { socket.disconnect(); return; }

      // JWT Doğrulama
      const decoded: any = server.jwt.verify(token);
      userId = Number(decoded.id);
      username = decoded.username;

      // --- KULLANICIYI GLOBAL STORE'A EKLE ---
      onlineUsers.set(userId, { 
          socketId: socket.id, 
          username, 
          status: 'AVAILABLE' 
      });
      
      socket.join(`user_${userId}`);
      console.log(`✅ ${username} (ID: ${userId}) bağlandı! Socket: ${socket.id}`);

      // Listeyi Yayınla
      const broadcastList = () => {
        const list = Array.from(onlineUsers.entries()).map(([id, u]) => ({ id, username: u.username, status: u.status }));
        (server as any).io.emit('online_users_list', list);
      };
      broadcastList();

      // --------------------------------------------------
      // 🎮 DAVET SİSTEMİ
      // --------------------------------------------------

      socket.on('invite_game', (data: { targetUserId: any }) => {
        const targetId = Number(data.targetUserId);
        const targetUser = onlineUsers.get(targetId);
        const senderUser = onlineUsers.get(userId);

        console.log(`📩 Davet İsteği: ${username} -> ID: ${targetId}`);

        if (targetUser && senderUser) {
            if (targetUser.status !== 'AVAILABLE') {
                console.log(`   ⚠️ Hedef meşgul: ${targetUser.status}`);
                socket.emit('invite_error', { message: `Kullanıcı şu an meşgul (${targetUser.status})` });
                return;
            }

            // Durumları kilitle
            targetUser.status = 'BUSY';
            targetUser.opponentId = userId;
            senderUser.status = 'BUSY';
            senderUser.opponentId = targetId;

            console.log(`   ✅ Davet iletiliyor: ${targetUser.socketId}`);
            (server as any).io.to(targetUser.socketId).emit('game_invite', {
                senderId: userId,
                senderName: username
            });
        } else {
            // Hata ayıklama için map anahtarlarını yazdır
            console.log(`   ❌ Kullanıcı bulunamadı! Mevcut ID'ler:`, Array.from(onlineUsers.keys()));
            socket.emit('invite_error', { message: 'Kullanıcı çevrimdışı!' });
        }
      });

      socket.on('invite_response', (data: { senderId: any, accepted: boolean }) => {
        const senderId = Number(data.senderId);
        const senderUser = onlineUsers.get(senderId);
        const currentUser = onlineUsers.get(userId);

        if (senderUser && currentUser) {
          if (data.accepted) {
             console.log(`🚀 Oyun Başlıyor: ${username} vs ${senderUser.username}`);
             senderUser.status = 'IN_GAME';
             currentUser.status = 'IN_GAME';

             socket.emit('game_start', { opponent: senderUser.username, role: 'player2', opponentId: senderId });
             (server as any).io.to(senderUser.socketId).emit('game_start', { opponent: username, role: 'player1', opponentId: userId });

          } else {
             console.log(`⛔ Davet reddedildi.`);
             senderUser.status = 'AVAILABLE';
             senderUser.opponentId = undefined;
             currentUser.status = 'AVAILABLE';
             currentUser.opponentId = undefined;

             (server as any).io.to(senderUser.socketId).emit('invite_rejected', { rejecterName: username });
          }
        }
      });

      // --------------------------------------------------
      // 🎾 OYUN İÇİ
      // --------------------------------------------------

      socket.on('game_paddle_move', (data: { y: number, opponentId: number }) => {
          const opponent = onlineUsers.get(data.opponentId);
          if (opponent) (server as any).io.to(opponent.socketId).emit('game_opponent_move', { y: data.y });
      });

      socket.on('game_ball_update', (data: any) => {
          const opponent = onlineUsers.get(data.opponentId);
          if (opponent) (server as any).io.to(opponent.socketId).emit('game_ball_sync', data);
      });

      socket.on('game_over_signal', (data: { winner: string, opponentId: number }) => {
         const opponent = onlineUsers.get(data.opponentId);
         const me = onlineUsers.get(userId);
         
         if (me) { me.status = 'AVAILABLE'; me.opponentId = undefined; }
         if (opponent) { 
             opponent.status = 'AVAILABLE'; 
             opponent.opponentId = undefined;
             (server as any).io.to(opponent.socketId).emit('game_ended', { winner: data.winner });
         }
      });

      // --- DISCONNECT ---

      socket.on('disconnect', () => {
        console.log(`❌ ${username} ayrıldı (Socket: ${socket.id})`);
        
        const me = onlineUsers.get(userId);
        
        if (me && me.socketId !== socket.id) {
            console.log(`ℹ️ ${username} için yeni bir bağlantı var, eskisini siliyorum ama kullanıcı kalıyor.`);
            return; 
        }

        // Rakibini serbest bırak
        if (me && me.opponentId) {
            const opponent = onlineUsers.get(me.opponentId);
            if (opponent) {
                opponent.status = 'AVAILABLE';
                opponent.opponentId = undefined;
                (server as any).io.to(opponent.socketId).emit('game_opponent_left');
            }
        }

        onlineUsers.delete(userId);
        broadcastList();
      });

    } catch (err) {
      console.log('⛔ Socket Hatası:', err);
      socket.disconnect();
    }
  });
};