// frontend/src/services/game.service.ts
const API_URL = 'http://localhost:3000/game';

export const saveGameReq = async (score1: number, score2: number, opponentName: string) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error("Giriş yapmalısınız!");

    const response = await fetch(`${API_URL}/save`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ score1, score2, opponentName })
    });

    if (!response.ok) {
        throw new Error('Oyun kaydedilemedi');
    }

    return await response.json();
};