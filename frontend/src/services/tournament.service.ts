// frontend/src/services/tournament.service.ts
import { fetchWrapper } from '../utils/fetchWrapper';

// DÜZELTME: Nginx uyumlu olması için localhost kısmı silindi
const API_URL = '/tournament';

export const saveTournamentReq = async (players: string[], winner: string) => {
    return await fetchWrapper.post(`${API_URL}/create`, {
        players,
        winner
    });
};

export const getTournamentHistoryReq = async () => {
    return await fetchWrapper.get(`${API_URL}/history`);
};