// frontend/src/services/friend.service.ts
import { fetchWrapper } from '../utils/fetchWrapper';

const API_URL = '/friends';

// GLOBAL HAFIZA: Sayfa değişse de hangi arkadaşlık isteklerinin yolda olduğunu unutmaz.
export const sentRequestsLocal = new Set<number>();

export const sendFriendReq = (receiverId: number) => fetchWrapper.post(`${API_URL}/add`, { receiverId });
export const acceptFriendReq = (senderId: number) => fetchWrapper.post(`${API_URL}/accept`, { senderId });
export const removeFriendReq = (targetId: number) => fetchWrapper.post(`${API_URL}/remove`, { targetId });
export const getFriendsReq = () => fetchWrapper.get(`${API_URL}/list`);
export const getPendingReq = () => fetchWrapper.get(`${API_URL}/pending`);