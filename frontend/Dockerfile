# frontend/Dockerfile

# 1. Hafif Node imajı kullan
FROM node:20-alpine

# 2. Çalışma klasörünü ayarla
WORKDIR /app

# 3. Paket listesini kopyala ve yükle
COPY package*.json ./
RUN npm install

# 4. Proje dosyalarını kopyala
COPY . .

# 5. Vite sunucusunu başlat
# --host parametresi ÇOK KRİTİK.
# Bunu yazmazsan sunucu sadece container içinde (localhost) çalışır, dışarıdan erişemezsin.
CMD ["npm", "run", "dev", "--", "--host"]