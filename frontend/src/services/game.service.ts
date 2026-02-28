// frontend/src/services/game.service.ts

const API_URL = '/game';

// DÜZELTME: opponentId hem sayı (Online) hem string (AI/Local) olabilir
export const saveGameReq = async (score1: number, score2: number, opponentId: number | string) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error("Giriş yapmalısınız!");

    const response = await fetch(`${API_URL}/save`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        // Body içinde artık opponentName değil, genel kullanım için opponentId gönderiyoruz
        body: JSON.stringify({ score1, score2, opponentId })
    });

    if (!response.ok) {
        throw new Error('Oyun kaydedilemedi');
    }

    return await response.json();
};