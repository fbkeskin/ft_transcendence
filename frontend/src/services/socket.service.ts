// frontend/src/services/socket.service.ts
import { io, Socket } from 'socket.io-client';

// Kullanıcı Tipi
interface OnlineUser {
  id: number;
  username: string;
  status?: 'AVAILABLE' | 'BUSY' | 'IN_GAME';
}

class SocketService {
  private socket: Socket | null = null;
  private static instance: SocketService;

  public currentGameRole: 'player1' | 'player2' | null = null;
  public currentOpponentName: string = "Rakip";
  public currentOpponentId: number = 0;
  
  // GLOBAL DAVET HAFIZASI
  public sentInvitesLocal = new Set<number>();
  
  // DAVET LİSTESİ (Gelenler)
  private pendingInvites: { senderId: number, senderName: string, timestamp: number }[] = [];

  private onlineUsers: Map<number, string> = new Map();
  private listeners: (() => void)[] = [];
  private eventListeners: Map<string, ((data: any) => void)[]> = new Map();

  private constructor() {}

  public static getInstance(): SocketService {
      if (!SocketService.instance) {
          SocketService.instance = new SocketService();
      }
      return SocketService.instance;
  }

  connect() {
    if (this.socket && this.socket.connected) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    if (this.socket) this.socket.disconnect();

    console.log("🔌 Socket bağlantısı başlatılıyor...");
    
    // DÜZELTME: 'http://localhost:3000' yerine '/' kullanıyoruz.
    // Nginx, /socket.io/ isteklerini otomatik olarak Backend'e yönlendirecek.
    this.socket = io('/', {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('✅ SOCKET BAĞLANDI! ID:', this.socket?.id);
      this.eventListeners.forEach((callbacks, event) => {
          callbacks.forEach(cb => this.socket?.on(event, cb));
      });
    });

    this.socket.on('disconnect', () => {
      console.log('❌ SOCKET KOPTU');
      this.onlineUsers.clear();
      this.notifyListeners();
    });

    this.socket.on('online_users_list', (users: OnlineUser[]) => {
        this.onlineUsers.clear();
        users.forEach(u => this.onlineUsers.set(u.id, u.username));
        this.notifyListeners();
    });

    this.socket.on('user_status', (data: { userId: number, username?: string, status: string }) => {
        if (data.status === 'ONLINE' && data.username) {
            this.onlineUsers.set(data.userId, data.username);
        } else if (data.status === 'OFFLINE') {
            this.onlineUsers.delete(data.userId);
        }
        this.notifyListeners();
    });
  }

    disconnect() {
        if (this.socket) {
          this.socket.disconnect();
          this.socket = null;
        }
    }

    sendPing() { this.socket?.emit('ping'); }

    updateStatus(status: 'AVAILABLE' | 'BUSY' | 'IN_GAME') {
        this.socket?.emit('update_status', { status });
    }

    getOnlineUsers(): OnlineUser[] {
        return Array.from(this.onlineUsers.entries()).map(([id, username]) => ({ id, username }));
    }

    getPendingInvites() {
        return this.pendingInvites;
    }

    removeInvite(senderId: number) {
        this.pendingInvites = this.pendingInvites.filter(i => i.senderId !== senderId);
        this.notifyListeners();
    }

    subscribe(callback: () => void) {
        this.listeners.push(callback);
        callback(); 
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    clearListeners() { this.listeners = []; }

    subscribeToEvent(event: string, callback: (data: any) => void) {
        if (!this.eventListeners.has(event)) this.eventListeners.set(event, []);
        this.eventListeners.get(event)?.push(callback);
        
        if (this.socket && this.socket.connected) {
            this.socket.on(event, callback);
        }

        // UNSIBSCRIBE fonksiyonu dönüyoruz
        return () => {
            const listeners = this.eventListeners.get(event);
            if (listeners) {
                const index = listeners.indexOf(callback);
                if (index > -1) listeners.splice(index, 1);
                if (listeners.length === 0) this.eventListeners.delete(event);
            }
            this.socket?.off(event, callback);
        };
    }

    private removeEventListeners(event: string) {
        // Bu metod artık tüm dinleyicileri SİLER. 
        // Dikkatli kullanılmalı veya spesifik unsubscription tercih edilmeli.
        this.socket?.off(event);
        this.eventListeners.delete(event);
    }

    private notifyListeners() { this.listeners.forEach(callback => callback()); }

    sendGameInvite(targetUserId: number) { this.socket?.emit('invite_game', { targetUserId }); }   
    respondToInvite(senderId: number, accepted: boolean) { this.socket?.emit('invite_response', { senderId, accepted }); }

    // YENİ: Hazırlık Handshake
    onMatchReadyCheck(callback: (data: { opponent: string, opponentId: number }) => void) {
        return this.subscribeToEvent('match_ready_check', callback);
    }

    confirmReady(opponentId: number) {
        this.socket?.emit('confirm_ready', { opponentId });
    }

        onGameStart(callback: (data: any) => void) { return this.subscribeToEvent('game_start', callback); }

        onInviteRejected(callback: (data: any) => void) { return this.subscribeToEvent('invite_rejected', callback); }

        onIncomingInvite(callback: (data: { senderId: number, senderName: string }) => void) { 

            return this.subscribeToEvent('game_invite', (data) => {

                // Listeye ekle (Eğer zaten yoksa)

                if (!this.pendingInvites.find(i => i.senderId === data.senderId)) {

                    this.pendingInvites.push({ ...data, timestamp: Date.now() });

                    this.notifyListeners();

                }

                callback(data);

            }); 

        }

        

        onInviteError(callback: (data: { type: 'INFO' | 'ERROR', code: string, message: string }) => void) { 

            return this.subscribeToEvent('invite_error', callback); 

        }

    offDashboardEvents() {
        this.removeEventListeners('invite_error');
        this.removeEventListeners('online_users_list');
        this.removeEventListeners('friend_request');
        this.removeEventListeners('friend_accepted');
        this.removeEventListeners('friend_list_update');
    }

    sendPaddleMove(y: number) {
        if (this.socket && this.currentOpponentId) {
            this.socket.emit('game_paddle_move', { y, opponentId: this.currentOpponentId });
        }
    }
    sendBallUpdate(ballX: number, ballY: number, score1: number, score2: number) {
        if (this.socket && this.currentOpponentId) {
            this.socket.emit('game_ball_update', { ballX, ballY, score1, score2, opponentId: this.currentOpponentId });
        }
    }
    sendGameOver(winner: string) {
        if (this.socket && this.currentOpponentId) {
             this.socket.emit('game_over_signal', { winner, opponentId: this.currentOpponentId });
        }
    }

    onOpponentMove(callback: (data: {y: number}) => void) { this.subscribeToEvent('game_opponent_move', callback); }
    onBallSync(callback: (data: {ballX: number, ballY: number, score1: number, score2: number}) => void) { this.subscribeToEvent('game_ball_sync', callback); }
    onGameEnded(callback: (data: {winner: string}) => void) { this.subscribeToEvent('game_ended', callback); }
    onOpponentLeft(callback: () => void) { this.subscribeToEvent('game_opponent_left', callback); }
    
    offGameEvents() {
        this.removeEventListeners('game_opponent_move');
        this.removeEventListeners('game_ball_sync');
        this.removeEventListeners('game_ended');
        this.removeEventListeners('game_opponent_left');
    }
}

export const socketService = SocketService.getInstance();