// frontend/src/services/tournament.service.ts
import { fetchWrapper } from '../utils/fetchWrapper';

const API_URL = 'http://localhost:3000/tournament';

export const saveTournamentReq = async (players: string[], winner: string) => {
    return await fetchWrapper.post(`${API_URL}/create`, {
        players,
        winner
    });
};

export const getTournamentHistoryReq = async () => {
    return await fetchWrapper.get(`${API_URL}/history`);
};