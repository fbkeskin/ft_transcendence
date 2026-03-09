import 'fastify';
import '@fastify/jwt';
import '@fastify/multipart'; // BU SATIR ÖNEMLİ!

declare module 'fastify' {
  interface FastifyRequest {
    jwt: any;
    user: {
      id: number;
      email: string;
      username: string;
    };
  }
  
  export interface FastifyInstance {
    authenticate: any;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      id: number;
      email: string;
      username: string;
    };
  }
}