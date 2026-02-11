// frontend/src/services/socket.service.ts
import { io, Socket } from 'socket.io-client';

// Kullanıcı Tipi
interface OnlineUser {
  id: number;
  username: string;
  status?: string; // BUSY, AVAILABLE, IN_GAME vb.
}

class SocketService {
  private socket: Socket | null = null;
  
  // Singleton instance (Tekil nesne)
  private static instance: SocketService;

  // OYUN VERİLERİNİ GEÇİCİ TUTACAK DEĞİŞKENLER
  public currentGameRole: 'player1' | 'player2' | null = null;
  public currentOpponentName: string = "Rakip";
  public currentOpponentId: number = 0;
  
  // ID -> Username eşleşmesi
  private onlineUsers: Map<number, string> = new Map();
  
  // UI güncellemeleri için dinleyiciler
  private listeners: (() => void)[] = [];

  // Singleton Yapısı: Constructor private yapılır
  private constructor() {}

  // Sadece bu method üzerinden erişilebilir
  public static getInstance(): SocketService {
      if (!SocketService.instance) {
          SocketService.instance = new SocketService();
      }
      return SocketService.instance;
  }

  connect() {
    // KORUMA: Eğer zaten bağlıysa tekrar bağlanma!
    if (this.socket && this.socket.connected) {
        console.log("⚠️ Socket zaten bağlı, yeni bağlantı açılmadı.");
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    // Varsa eskiyi kapat (Garanti olsun)
    if (this.socket) {
        this.socket.disconnect();
    }

    console.log("🔌 Socket bağlantısı başlatılıyor...");
    this.socket = io('http://localhost:3000', {
      auth: { token },
      transports: ['websocket'],
      reconnection: true, // Otomatik tekrar bağlanma
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('✅ SOCKET BAĞLANDI! ID:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ SOCKET KOPTU');
      this.onlineUsers.clear();
      this.notifyListeners();
      // socket nesnesini null yapmıyoruz ki reconnection çalışsın
    });

    // Listeyi alıp Map'e çeviriyoruz
    this.socket.on('online_users_list', (users: OnlineUser[]) => {
        // console.log("📋 Liste alındı:", users);
        this.onlineUsers.clear();
        users.forEach(u => this.onlineUsers.set(u.id, u.username));
        this.notifyListeners();
    });

    // Tekil kullanıcı güncellemesi
    this.socket.on('user_status', (data: { userId: number, username?: string, status: string }) => {
        if (data.status === 'ONLINE' && data.username) {
            this.onlineUsers.set(data.userId, data.username);
        } else if (data.status === 'OFFLINE') {
            this.onlineUsers.delete(data.userId);
        }
        // BUSY durumu şimdilik listeden silmiyor, sadece status güncelliyor (istenirse eklenebilir)
        this.notifyListeners();
    });
  }

    disconnect() {
        if (this.socket) {
          this.socket.disconnect();
          this.socket = null;
        }
    }

    sendPing() {
        this.socket?.emit('ping');
    }

    // Dashboard'a listeyi {id, username} dizisi olarak ver
    getOnlineUsers(): OnlineUser[] {
        return Array.from(this.onlineUsers.entries()).map(([id, username]) => ({ id, username }));
    }

    subscribe(callback: () => void) {
        this.listeners.push(callback);
        callback(); 
    }

    // YENİ: Herhangi bir event'i dinlemek için genel metod
    subscribeToEvent(event: string, callback: (data: any) => void) {
        this.socket?.on(event, callback);
    }

    private notifyListeners() {
        this.listeners.forEach(callback => callback());
    }

    // --- DAVET SİSTEMİ ---

    sendGameInvite(targetUserId: number) {
        this.socket?.emit('invite_game', { targetUserId });
    }   

    respondToInvite(senderId: number, accepted: boolean) {
        this.socket?.emit('invite_response', { senderId, accepted });
    }

    onGameStart(callback: (data: any) => void) {
        this.socket?.on('game_start', callback);
    }

    onInviteRejected(callback: (data: any) => void) {
        this.socket?.on('invite_rejected', callback);
    }

    onIncomingInvite(callback: (data: { senderId: number, senderName: string }) => void) {
        this.socket?.on('game_invite', callback);
    }

    // YENİ: Meşgul hatası dinleyicisi
    onInviteError(callback: (data: {message: string}) => void) {
        this.socket?.on('invite_error', callback);
    }

    // --- OYUN İÇİ SOCKET METODLARI ---
    
    // Raketimi gönder
    sendPaddleMove(y: number) {
        if (this.socket && this.currentOpponentId) {
            this.socket.emit('game_paddle_move', { y, opponentId: this.currentOpponentId });
        }
    }

    // (Sadece P1) Topu gönder
    sendBallUpdate(ballX: number, ballY: number, score1: number, score2: number) {
        if (this.socket && this.currentOpponentId) {
            this.socket.emit('game_ball_update', { ballX, ballY, score1, score2, opponentId: this.currentOpponentId });
        }
    }
    
    // (Sadece P1) Oyun bitti sinyali
    sendGameOver(winner: string) {
        if (this.socket && this.currentOpponentId) {
             this.socket.emit('game_over_signal', { winner, opponentId: this.currentOpponentId });
        }
    }

    // DINLEYICILER
    onOpponentMove(callback: (data: {y: number}) => void) {
        this.socket?.on('game_opponent_move', callback);
    }

    onBallSync(callback: (data: {ballX: number, ballY: number, score1: number, score2: number}) => void) {
        this.socket?.on('game_ball_sync', callback);
    }

    onGameEnded(callback: (data: {winner: string}) => void) {
        this.socket?.on('game_ended', callback);
    }

    // YENİ: Rakip Oyundan Düştü
    onOpponentLeft(callback: () => void) {
        this.socket?.on('game_opponent_left', callback);
    }
    
    // Listener temizliği (Component unmount olunca)
    offGameEvents() {
        this.socket?.off('game_opponent_move');
        this.socket?.off('game_ball_sync');
        this.socket?.off('game_ended');
        this.socket?.off('game_opponent_left');
    }
}

// Singleton olduğu için artık 'new' ile değil, getInstance ile export ediyoruz
export const socketService = SocketService.getInstance();