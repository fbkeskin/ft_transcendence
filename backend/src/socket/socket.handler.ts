// backend/src/socket/socket.handler.ts
import { FastifyInstance } from 'fastify';
import { Socket } from 'socket.io';
import { onlineUsers } from './store'; 

export const handleSocket = (server: FastifyInstance) => {
  
  (server as any).io.on('connection', async (socket: Socket) => {
    let userId: number;
    let initialUsername: string;

    try {
      const token = socket.handshake.auth.token;
      if (!token) { socket.disconnect(); return; }

      const decoded: any = server.jwt.verify(token);
      userId = Number(decoded.id);
      initialUsername = decoded.username;

      onlineUsers.set(userId, { 
          socketId: socket.id, 
          username: initialUsername, 
          status: 'AVAILABLE' 
      });
      
      socket.join(`user_${userId}`);
      console.log(`✅ ${initialUsername} (ID: ${userId}) bağlandı!`);

      const broadcastList = () => {
        const list = Array.from(onlineUsers.entries()).map(([id, u]) => ({ id, username: u.username, status: u.status }));
        (server as any).io.emit('online_users_list', list);
      };
      broadcastList();

      const getMyUsername = () => onlineUsers.get(userId)?.username || initialUsername;

      // --- STATUS GÜNCELLEME ---
      socket.on('update_status', (data: { status: 'AVAILABLE' | 'BUSY' | 'IN_GAME' | 'WAITING' }) => {
          const user = onlineUsers.get(userId);
          if (user) {
              // --- OYUNDAN KAÇMA KONTROLÜ ---
              if (user.status === 'IN_GAME' && data.status !== 'IN_GAME' && user.opponentId) {
                  const opponent = onlineUsers.get(user.opponentId);
                  if (opponent) {
                      (server as any).io.to(opponent.socketId).emit('game_opponent_left');
                      opponent.status = 'AVAILABLE';
                      opponent.opponentId = undefined;
                  }
              }
              // ------------------------------
              user.status = data.status;
              broadcastList(); 
          }
      });

      // --- DAVET SİSTEMİ ---
      socket.on('invite_game', (data: { targetUserId: any }) => {
        const targetId = Number(data.targetUserId);
        const targetUser = onlineUsers.get(targetId);
        const senderUser = onlineUsers.get(userId);

        if (targetUser && senderUser) {
            // --- KARŞILIKLI İSTEK ---
            if (targetUser.status === 'WAITING' && targetUser.opponentId === userId) {
                socket.emit('match_ready_check', { opponent: targetUser.username, opponentId: targetId, isMutual: true });
                (server as any).io.to(targetUser.socketId).emit('match_ready_check', { opponent: getMyUsername(), opponentId: userId, isMutual: true });
                return;
            }

            if (targetUser.status === 'IN_GAME' || targetUser.status === 'WAITING') {
                socket.emit('invite_error', { type: 'ERROR', code: 'USER_BUSY', message: 'error_USER_BUSY' });
                return;
            }

            targetUser.status = 'WAITING';
            senderUser.status = 'WAITING';
            targetUser.opponentId = userId;
            senderUser.opponentId = targetId;

            (server as any).io.to(targetUser.socketId).emit('game_invite', {
                senderId: userId,
                senderName: getMyUsername()
            });
            broadcastList();
        }
      });

      socket.on('invite_response', (data: { senderId: any, accepted: boolean }) => {
        const senderId = Number(data.senderId);
        const senderUser = onlineUsers.get(senderId);
        const currentUser = onlineUsers.get(userId);

        if (senderUser && currentUser) {
          if (data.accepted) {
             socket.emit('match_ready_check', { opponent: senderUser.username, opponentId: senderId });
             (server as any).io.to(senderUser.socketId).emit('match_ready_check', { opponent: getMyUsername(), opponentId: userId });
          } else {
             senderUser.status = 'AVAILABLE'; senderUser.opponentId = undefined;
             currentUser.status = 'AVAILABLE'; currentUser.opponentId = undefined;
             (server as any).io.to(senderUser.socketId).emit('invite_rejected', { rejecterName: getMyUsername() });
          }
          broadcastList();
        }
      });

      socket.on('confirm_ready', (data: { opponentId: number }) => {
          const me = onlineUsers.get(userId);
          const opponent = onlineUsers.get(data.opponentId);
          if (me && opponent) {
              (me as any).isReady = true;
              if ((opponent as any).isReady) {
                  me.status = 'IN_GAME'; opponent.status = 'IN_GAME';
                  delete (me as any).isReady; delete (opponent as any).isReady;
                  
                  socket.emit('game_start', { opponent: opponent.username, role: 'player2', opponentId: data.opponentId });
                  (server as any).io.to(opponent.socketId).emit('game_start', { opponent: getMyUsername(), role: 'player1', opponentId: userId });
              } else {
                  (server as any).io.to(opponent.socketId).emit('opponent_ready');
              }
          }
      });

      socket.on('game_paddle_move', (data: any) => {
          const opp = onlineUsers.get(data.opponentId);
          if (opp) (server as any).io.to(opp.socketId).emit('game_opponent_move', { y: data.y });
      });
      socket.on('game_ball_update', (data: any) => {
          const opp = onlineUsers.get(data.opponentId);
          if (opp) (server as any).io.to(opp.socketId).emit('game_ball_sync', data);
      });
      socket.on('game_over_signal', (data: any) => {
         const opp = onlineUsers.get(data.opponentId);
         const me = onlineUsers.get(userId);
         if (me) { me.status = 'AVAILABLE'; me.opponentId = undefined; }
         if (opp) { opp.status = 'AVAILABLE'; opp.opponentId = undefined; (server as any).io.to(opp.socketId).emit('game_ended', { winner: data.winner }); }
         broadcastList();
      });

      socket.on('disconnect', () => {
        const me = onlineUsers.get(userId);
        if (me && me.socketId === socket.id) {
            // --- OYUNDAN AYRILMA KONTROLÜ ---
            if (me.status === 'IN_GAME' && me.opponentId) {
                const opponent = onlineUsers.get(me.opponentId);
                if (opponent) {
                    (server as any).io.to(opponent.socketId).emit('game_opponent_left');
                    opponent.status = 'AVAILABLE';
                    opponent.opponentId = undefined;
                }
            }
            // -------------------------------
            onlineUsers.delete(userId);
            broadcastList();
        }
      });

    } catch (err) { socket.disconnect(); }
  });
};