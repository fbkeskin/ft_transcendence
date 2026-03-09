// backend/src/socket/store.ts

export interface OnlineUser {
	socketId: string;
	username: string;
	status: 'AVAILABLE' | 'BUSY' | 'IN_GAME' | 'WAITING';
	opponentId?: number;
  }
  
  // Global Online Kullanıcı Listesi
  export const onlineUsers = new Map<number, OnlineUser>();
  
export const updateOnlineUsername = (userId: number, newUsername: string) => {
    const user = onlineUsers.get(userId);
    if (user) {
        user.username = newUsername;
    }
};

//ID ver, Socket ID al
  export const getSocketId = (userId: number): string | undefined => {
	  return onlineUsers.get(userId)?.socketId;
  };