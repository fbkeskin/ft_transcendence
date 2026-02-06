# backend/Dockerfile

# Alpine yerine Debian tabanlı (Ubuntu ile uyumlu) tam sürüm kullanıyoruz
FROM node:20

WORKDIR /usr/src/app

# Gerekli sistem kütüphanelerini kur (Debian/Ubuntu komutları)
RUN apt-get update && apt-get install -y openssl python3 make g++

# Paket dosyalarını kopyala
COPY package*.json ./

# Paketleri yükle
RUN npm install

# Kaynak kodları kopyala
COPY . .

# Prisma istemcisini oluştur (Debian için)
RUN npx prisma generate

EXPOSE 3000

CMD [ "npm", "run", "dev" ]