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

WHITE = \033[1;37m

# 1. Konteynerleri İnşa Et ve Başlat (Detached Mode - Arka planda)
up:
	@echo "$(GREEN)Building and starting containers...$(RESET)"
	@docker compose -p $(NAME) up -d --build --remove-orphans
	@echo ""
	@echo "$(GREEN)✅ Containers are up and running!$(RESET)"
	@echo "$(GREEN)🌐 Access the application at: $(WHITE)https://localhost$(RESET)"
	@echo "$(BLUE)📝 Type 'make logs' to see the logs.$(RESET)"
	@echo ""

# 2. Konteynerleri Durdur ve Kaldır (Ağları da temizler)
down:
	@echo "$(RED)Stopping and removing containers...$(RESET)"
	@docker compose -p $(NAME) down --remove-orphans

# 3. Sadece Durdur (Kaldırmadan)
stop:
	@echo "$(YELLOW)Stopping containers...$(RESET)"
	@docker compose -p $(NAME) stop

# 4. Başlat (Build etmeden, sadece start)
start:
	@echo "$(GREEN)Starting containers...$(RESET)"
	@docker compose -p $(NAME) start

# 5. Logları İzle (Ctrl+C ile çıkılır)
logs:
	@docker compose -p $(NAME) logs -f

# 6. Temizlik (Containerları siler ama Database verisi kalır)
clean:
	@echo "$(RED)Cleaning containers and networks...$(RESET)"
	@docker compose -p $(NAME) down -v --remove-orphans
	@echo "$(YELLOW)Cleaned up containers and networks.$(RESET)"

# 7. Derin Temizlik (Database verisini, imageları ve her şeyi siler - SIFIRLAR)
fclean:
	@echo "$(RED)Removing images, volumes, and DATABASE files...$(RESET)"
	@docker compose -p $(NAME) down --rmi all --volumes --remove-orphans
	@docker rm -f ft_frontend_dev ft_backend_dev ft_nginx_dev 2>/dev/null || true
	@rm -f backend/prisma/dev.db
	@rm -f backend/prisma/dev.db-journal
	@echo "$(YELLOW)Cleaning dependencies (node_modules & package-lock.json)...$(RESET)"
	@rm -rf frontend/node_modules frontend/package-lock.json
	@rm -rf backend/node_modules backend/package-lock.json
	@echo "$(YELLOW)Cleaning uploads (preserving default.png)...$(RESET)"
	@find uploads/ -type f ! -name 'default.png' ! -name '.gitkeep' -delete
	@echo "$(GREEN)Full clean complete (Database and uploads cleaned).$(RESET)"

# 8. Yeniden Başlat (Sıfırdan kurar)
re: fclean up

# 9. Prisma Studio'yu Aç (Veritabanını tarayıcıdan görmek için opsiyonel)
studio:
	@echo "$(BLUE)Starting Prisma Studio...$(RESET)"
	@docker exec -it ft_backend_dev npx prisma studio

.PHONY: all up down stop start logs clean fclean re studio