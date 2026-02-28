// backend/src/socket/socket.handler.ts
import { FastifyInstance } from 'fastify';
import { Socket } from 'socket.io';
import { onlineUsers, OnlineUser } from './store'; 

export const handleSocket = (server: FastifyInstance) => {
  
  (server as any).io.on('connection', async (socket: Socket) => {
    let userId: number;
    let username: string;

    try {
      const token = socket.handshake.auth.token;
      if (!token) { socket.disconnect(); return; }

      const decoded: any = server.jwt.verify(token);
      userId = Number(decoded.id);
      username = decoded.username;

      onlineUsers.set(userId, { 
          socketId: socket.id, 
          username, 
          status: 'AVAILABLE' 
      });
      
      socket.join(`user_${userId}`);
      console.log(`✅ ${username} (ID: ${userId}) bağlandı! Socket: ${socket.id}`);

      const broadcastList = () => {
        const list = Array.from(onlineUsers.entries()).map(([id, u]) => ({ id, username: u.username, status: u.status }));
        (server as any).io.emit('online_users_list', list);
      };
      broadcastList();

      // --- STATUS GÜNCELLEME ---
      socket.on('update_status', (data: { status: 'AVAILABLE' | 'BUSY' | 'IN_GAME' | 'WAITING' }) => {
          const user = onlineUsers.get(userId);
          if (user) {
              user.status = data.status;
              console.log(`👤 ${username} status güncellendi: ${data.status}`);
              broadcastList(); 
          }
      });

      // --- DAVET SİSTEMİ ---
      socket.on('invite_game', (data: { targetUserId: any }) => {
        const targetId = Number(data.targetUserId);
        const targetUser = onlineUsers.get(targetId);
        const senderUser = onlineUsers.get(userId);

        if (targetUser && senderUser) {
            // Zaten bir davet bekliyorsa veya online maçtaysa meşgul
            if (targetUser.status === 'IN_GAME' || targetUser.status === 'WAITING') {
                socket.emit('invite_error', { 
                    type: 'ERROR', 
                    code: 'USER_BUSY', 
                    message: `error_USER_BUSY` 
                });
                return;
            }

            // Eğer local oyundaysa (BUSY), uyar ama gönder
            if (targetUser.status === 'BUSY') {
                socket.emit('invite_error', { 
                    type: 'INFO', 
                    code: 'USER_IN_OTHER_GAME', 
                    message: `error_USER_IN_OTHER_GAME` 
                });
            }

            targetUser.status = 'WAITING';
            senderUser.status = 'WAITING';
            targetUser.opponentId = userId;
            senderUser.opponentId = targetId;

            (server as any).io.to(targetUser.socketId).emit('game_invite', {
                senderId: userId,
                senderName: username
            });
            broadcastList();
        } else {
            socket.emit('invite_error', { 
                type: 'ERROR', 
                code: 'USER_OFFLINE', 
                message: 'error_USER_OFFLINE' 
            });
        }
      });

      socket.on('invite_response', (data: { senderId: any, accepted: boolean }) => {
        const senderId = Number(data.senderId);
        const senderUser = onlineUsers.get(senderId);
        const currentUser = onlineUsers.get(userId);

        if (senderUser && currentUser) {
          if (data.accepted) {
             console.log(`🤝 Davet kabul edildi, hazırlık bekleniyor: ${username} & ${senderUser.username}`);
             // Durumları WAITING'de tutmaya devam ediyoruz (veya READY_WAITING gibi bir şey)
             // Her iki tarafa da "Hazır mısın?" diye soracak bir event gönder
             socket.emit('match_ready_check', { opponent: senderUser.username, opponentId: senderId });
             (server as any).io.to(senderUser.socketId).emit('match_ready_check', { opponent: username, opponentId: userId });
          } else {
             senderUser.status = 'AVAILABLE';
             senderUser.opponentId = undefined;
             currentUser.status = 'AVAILABLE';
             currentUser.opponentId = undefined;
             (server as any).io.to(senderUser.socketId).emit('invite_rejected', { rejecterName: username });
          }
          broadcastList();
        }
      });

      // --- YENİ: HAZIRLIK ONAYI ---
      socket.on('confirm_ready', (data: { opponentId: number }) => {
          const me = onlineUsers.get(userId);
          const opponent = onlineUsers.get(data.opponentId);

          if (me && opponent) {
              (me as any).isReady = true;
              console.log(`✅ ${username} hazır.`);

              // Eğer rakip de hazırsa maçı başlat!
              if ((opponent as any).isReady) {
                  console.log(`🚀 HER İKİ TARAF HAZIR! Maç başlıyor.`);
                  me.status = 'IN_GAME';
                  opponent.status = 'IN_GAME';
                  delete (me as any).isReady;
                  delete (opponent as any).isReady;

                  socket.emit('game_start', { opponent: opponent.username, role: 'player2', opponentId: data.opponentId });
                  (server as any).io.to(opponent.socketId).emit('game_start', { opponent: username, role: 'player1', opponentId: userId });
              } else {
                  // Rakibe senin hazır olduğunu fısılda (isteğe bağlı UI için)
                  (server as any).io.to(opponent.socketId).emit('opponent_ready');
              }
          }
      });

      // --- OYUN İÇİ ---
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
         if (me) { 
             me.status = 'AVAILABLE'; 
             me.opponentId = undefined; 
         }
         if (opponent) { 
             opponent.status = 'AVAILABLE'; 
             opponent.opponentId = undefined;
             (server as any).io.to(opponent.socketId).emit('game_ended', { winner: data.winner });
         }
         broadcastList();
      });

      socket.on('disconnect', () => {
        const me = onlineUsers.get(userId);
        if (me && me.socketId !== socket.id) return; 
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
      socket.disconnect();
    }
  });
};