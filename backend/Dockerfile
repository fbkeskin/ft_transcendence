# backend/Dockerfile

FROM node:20

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y openssl python3 make g++

COPY package*.json ./

RUN npm install
COPY . .
RUN npx prisma generate

EXPOSE 3000

CMD [ "npm", "run", "dev" ]