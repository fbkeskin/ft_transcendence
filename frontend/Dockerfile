# frontend/Dockerfile

# Alpine yerine tam sürüm (Debian/Ubuntu tabanlı) kullanıyoruz
# Bu, senin bilgisayarınla (Ubuntu) daha uyumlu çalışır.
FROM node:20

WORKDIR /app

# Paket listesini kopyala ve yükle
COPY package*.json ./
RUN npm install

# Proje dosyalarını kopyala
COPY . .

# Vite sunucusunu başlat
CMD ["npm", "run", "dev", "--", "--host"]