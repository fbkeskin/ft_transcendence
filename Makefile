# Renk Kodları (Terminal çıktısı güzel görünsün diye)
GREEN = \033[0;32m
RED = \033[0;31m
BLUE = \033[0;34m
YELLOW = \033[0;33m
RESET = \033[0m

# Proje İsmi (Docker Compose servisi için genel isim)
NAME = ft_transcendence

# Varsayılan hedef
all: up

# 1. Konteynerleri İnşa Et ve Başlat (Detached Mode - Arka planda)
up:
	@echo "$(GREEN)Building and starting containers...$(RESET)"
	@docker-compose up -d --build
	@echo "$(GREEN)Containers are up and running!$(RESET)"
	@echo "$(BLUE)Type 'make logs' to see the output.$(RESET)"

# 2. Konteynerleri Durdur ve Kaldır (Ağları da temizler)
down:
	@echo "$(RED)Stopping and removing containers...$(RESET)"
	@docker-compose down

# 3. Sadece Durdur (Kaldırmadan)
stop:
	@echo "$(YELLOW)Stopping containers...$(RESET)"
	@docker-compose stop

# 4. Başlat (Build etmeden, sadece start)
start:
	@echo "$(GREEN)Starting containers...$(RESET)"
	@docker-compose start

# 5. Logları İzle (Ctrl+C ile çıkılır)
logs:
	@docker-compose logs -f

# 6. Temizlik (Containerları siler ama Database verisi kalır)
clean: down
	@echo "$(YELLOW)Cleaned up containers and networks.$(RESET)"

# 7. Derin Temizlik (Database verisini, imageları ve her şeyi siler - SIFIRLAR)
# Docker tarafını temizle (Container, Network, Volume, Image)
# SENİN BİLGİSAYARINDAKİ SQLite veritabanı dosyasını sil (Krıtik Nokta Burası)
# Eğer yüklenen resimleri de silmek istersen (Uploads):
# @rm -rf uploads/* <-- İsteğe bağlı, genelde fclean bunu da siler.
fclean: down
	@echo "$(RED)Removing images, volumes, and DATABASE files...$(RESET)"
	@docker-compose down --rmi all --volumes --remove-orphans
	@rm -f backend/prisma/dev.db
	@rm -f backend/prisma/dev.db-journal
	@echo "$(YELLOW)Cleaning uploads (preserving default.png)...$(RESET)"
	@find uploads/ -type f ! -name 'default.png' -delete
	@echo "$(GREEN)Full clean complete (Database and uploads cleaned).$(RESET)"

# 8. Yeniden Başlat (Sıfırdan kurar)
re: fclean up

# 9. Prisma Studio'yu Aç (Veritabanını tarayıcıdan görmek için opsiyonel)
studio:
	@echo "$(BLUE)Starting Prisma Studio...$(RESET)"
	@docker exec -it ft_backend_dev npx prisma studio

.PHONY: all up down stop start logs clean fclean re studio