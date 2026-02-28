# nginx/Dockerfile
FROM nginx:alpine

# SSL Sertifikası oluşturmak için openssl kur
RUN apk add --no-cache openssl

# Sertifikaların duracağı klasörü yarat
RUN mkdir -p /etc/nginx/ssl

# Self-signed (Kendi imzaladığımız) SSL sertifikasını üret
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/key.pem \
    -out /etc/nginx/ssl/cert.pem \
    -subj "/C=TR/ST=Istanbul/L=Istanbul/O=42Istanbul/OU=Network/CN=localhost"

# Ayar dosyamızı Nginx'in içine kopyala
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443