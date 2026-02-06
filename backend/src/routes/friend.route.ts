// backend/src/routes/friend.route.ts
import { FastifyInstance } from 'fastify';
import { sendFriendRequest, acceptFriendRequest, removeFriend, getFriends, getPendingRequests } from '../controllers/friend.controller';

export async function friendRoutes(server: FastifyInstance) {
    server.addHook('preHandler', async (request) => {
        await request.jwtVerify();
    });

    server.post('/add', sendFriendRequest);
    server.post('/accept', acceptFriendRequest);
    server.post('/remove', removeFriend);
    server.get('/list', getFriends);
    server.get('/pending', getPendingRequests);
}