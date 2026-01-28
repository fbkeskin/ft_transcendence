# 1. Base Image: Node.js'in 20. sürümünün en hafif (Alpine) versiyonu
FROM node:20-alpine

# 2. Container içindeki çalışma klasörümüz
WORKDIR /usr/src/app

# YENİ EKLENEN KISIM: OpenSSL yüklemesi
# Alpine Linux'ta prisma'nın çalışması için bu gereklidir.
RUN apk add --no-cache openssl

# 3. Önce sadece paket dosyalarını kopyalıyoruz
# Neden? Çünkü kodun değişse bile paketlerin değişmezse Docker bu adımı cache'den çeker, hız kazanırız.
COPY package*.json ./

# 4. Bağımlılıkları yüklüyoruz
RUN npm install

# 5. Şimdi kaynak kodların geri kalanını kopyalıyoruz
COPY . .

# 6. Prisma kullanacağımız için istemciyi (client) üretiyoruz
# Bu, node_modules içine Prisma motorunu ekler.
RUN npx prisma generate

# 7. Portu belirtiyoruz (Bilgilendirme amaçlı)
EXPOSE 3000

# 8. Başlatma komutu
# "dev" modunda başlatıyoruz ki nodemon çalışsın
CMD [ "npm", "run", "dev" ]