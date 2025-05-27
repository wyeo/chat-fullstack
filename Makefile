# ===============================================
# FULLSTACK CHAT - COMMANDES DE DÉVELOPPEMENT
# ===============================================

# Variables
DOCKER_COMPOSE = docker-compose
NX = npx nx

# Couleurs pour les messages
GREEN = \033[0;32m
YELLOW = \033[1;33m
NC = \033[0m # No Color

.PHONY: help install start stop clean logs dev test build

# Affiche l'aide
help:
	@echo "$(GREEN)🚀 FULLSTACK CHAT - Commandes disponibles:$(NC)"
	@echo ""
	@echo "$(YELLOW)📦 INSTALLATION:$(NC)"
	@echo "  make install          - Installe les dépendances"
	@echo "  make setup            - Configuration initiale complète"
	@echo ""
	@echo "$(YELLOW)🐳 DOCKER:$(NC)"
	@echo "  make start            - Démarre tous les services (Docker + Apps)"
	@echo "  make stop             - Arrête tous les services"
	@echo "  make restart          - Redémarre tous les services"
	@echo "  make clean            - Nettoie tout (containers, volumes, etc.)"
	@echo "  make logs             - Affiche les logs de tous les services"
	@echo ""
	@echo "$(YELLOW)🛠️  DÉVELOPPEMENT:$(NC)"
	@echo "  make dev              - Mode développement (DB + Backend + Frontend)"
	@echo "  make dev-backend      - Lance seulement backend + DB"
	@echo "  make dev-frontend     - Lance seulement frontend"
	@echo "  make db-only          - Lance seulement les bases de données"
	@echo ""
	@echo "$(YELLOW)🧪 TESTS:$(NC)"
	@echo "  make test             - Lance tous les tests"
	@echo "  make test-backend     - Tests backend uniquement"
	@echo "  make test-frontend    - Tests frontend uniquement"
	@echo ""
	@echo "$(YELLOW)🏗️  BUILD:$(NC)"
	@echo "  make build            - Build de production"
	@echo "  make build-backend    - Build backend uniquement"
	@echo "  make build-frontend   - Build frontend uniquement"

# Installation des dépendances
install:
	@echo "$(GREEN)📦 Installation des dépendances...$(NC)"
	yarn install

# Configuration initiale
setup: install
	@echo "$(GREEN)⚙️  Configuration initiale...$(NC)"
	@if [ ! -f .env ]; then cp .env.example .env; echo "$(YELLOW)📝 Fichier .env créé depuis .env.example$(NC)"; fi
	@mkdir -p docker/postgres docker/mongodb
	@echo "$(GREEN)✅ Setup terminé ! Éditez le fichier .env si nécessaire$(NC)"

# Démarre tous les services
start: 
	@echo "$(GREEN)🚀 Démarrage de tous les services...$(NC)"
	$(DOCKER_COMPOSE) up -d
	@echo "$(GREEN)✅ Services Docker démarrés$(NC)"
	@echo "$(YELLOW)🔗 Interfaces disponibles:$(NC)"
	@echo "  - pgAdmin: http://localhost:5050"
	@echo "  - Mongo Express: http://localhost:8081"

# Arrête tous les services
stop:
	@echo "$(YELLOW)🛑 Arrêt de tous les services...$(NC)"
	$(DOCKER_COMPOSE) down
	@echo "$(GREEN)✅ Tous les services arrêtés$(NC)"

# Redémarre tous les services
restart: stop start

# Nettoie tout
clean:
	@echo "$(YELLOW)🧹 Nettoyage complet...$(NC)"
	$(DOCKER_COMPOSE) down -v --remove-orphans
	docker system prune -f
	@echo "$(GREEN)✅ Nettoyage terminé$(NC)"

# Affiche les logs
logs:
	@echo "$(GREEN)📋 Affichage des logs...$(NC)"
	$(DOCKER_COMPOSE) logs -f

# Mode développement complet
dev: db-only
	@echo "$(GREEN)🛠️  Mode développement - Backend + Frontend...$(NC)"
	@sleep 3
	yarn dev:run

# Backend seulement
dev-backend: db-only
	@echo "$(GREEN)🛠️  Mode développement - Backend seulement...$(NC)"
	@sleep 3
	yarn dev:backend

# Frontend seulement
dev-frontend:
	@echo "$(GREEN)🛠️  Mode développement - Frontend seulement...$(NC)"
	yarn dev:frontend

# Bases de données seulement
db-only:
	@echo "$(GREEN)🗄️  Démarrage des bases de données...$(NC)"
	$(DOCKER_COMPOSE) up -d postgres mongodb
	@echo "$(GREEN)✅ Bases de données démarrées$(NC)"
	@echo "$(YELLOW)🔗 Interfaces disponibles:$(NC)"
	@echo "  - PostgreSQL: localhost:5432"
	@echo "  - MongoDB: localhost:27017"
	@echo "  - pgAdmin: http://localhost:5050"
	@echo "  - Mongo Express: http://localhost:8081"

# Tests
test:
	@echo "$(GREEN)🧪 Lancement de tous les tests...$(NC)"
	yarn test

test-backend:
	@echo "$(GREEN)🧪 Tests backend...$(NC)"
	yarn test:backend

test-frontend:
	@echo "$(GREEN)🧪 Tests frontend...$(NC)"
	yarn test:frontend

# Build
build:
	@echo "$(GREEN)🏗️  Build de production...$(NC)"
	yarn build

build-backend:
	@echo "$(GREEN)🏗️  Build backend...$(NC)"
	yarn build -- --projects=backend

build-frontend:
	@echo "$(GREEN)🏗️  Build frontend...$(NC)"
	yarn build -- --projects=frontend

# Commande par défaut
.DEFAULT_GOAL := help