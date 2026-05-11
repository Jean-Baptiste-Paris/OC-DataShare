# DataShare — raccourcis dev / test / perf
# Usage : `make <target>`. `make help` pour la liste.

.DEFAULT_GOAL := help
SHELL := /bin/bash

API_DIR  := api
FRONT_DIR := front

# ============================================================================
# Aide
# ============================================================================

.PHONY: help
help:
	@printf "\nDataShare — cibles disponibles :\n\n"
	@grep -E '^[a-zA-Z0-9_.-]+:.*?##' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*?##"}; {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}'
	@echo ""

# ============================================================================
# Installation initiale
# ============================================================================

.PHONY: install
install: install-back install-front init-env init-db init-jwt init-storage ## Setup complet (deps + .env + BDDs + migrations + JWT + dirs)
	@echo ""
	@echo "✅ Installation terminée."
	@echo "   Lance le back : make back"
	@echo "   Lance le front : make front"
	@echo "   Seede un user demo + 7 fichiers fixtures : make seed-demo"

.PHONY: install-back
install-back: ## Installe les dépendances Composer (back)
	cd $(API_DIR) && composer install --no-interaction

.PHONY: install-front
install-front: ## Installe les dépendances npm (front)
	cd $(FRONT_DIR) && npm install

.PHONY: init-env
init-env: ## Crée .env.local pour le back (passphrase JWT générée) et front si absents
	@if [ ! -f $(API_DIR)/.env.local ]; then \
	  echo "→ Génération de $(API_DIR)/.env.local"; \
	  PASSPHRASE=$$(openssl rand -base64 32); \
	  printf 'APP_SECRET=%s\nDATABASE_URL="postgresql://postgres@127.0.0.1:5432/datashare?serverVersion=18&charset=utf8"\nJWT_SECRET_KEY=%%kernel.project_dir%%/config/jwt/private.pem\nJWT_PUBLIC_KEY=%%kernel.project_dir%%/config/jwt/public.pem\nJWT_PASSPHRASE=%s\nSTORAGE_PATH=%%kernel.project_dir%%/var/storage\nCORS_ALLOW_ORIGIN=^https?://localhost(:[0-9]+)?$$\n' \
	    "$$(openssl rand -hex 32)" "$$PASSPHRASE" > $(API_DIR)/.env.local; \
	  echo "JWT_PASSPHRASE=$$PASSPHRASE" > $(API_DIR)/.env.test.local; \
	  echo 'DATABASE_URL="postgresql://postgres@127.0.0.1:5432/datashare?serverVersion=18&charset=utf8"' >> $(API_DIR)/.env.test.local; \
	else \
	  echo "→ $(API_DIR)/.env.local existe déjà, skip"; \
	fi
	@if [ ! -f $(FRONT_DIR)/.env.local ]; then \
	  echo "→ Génération de $(FRONT_DIR)/.env.local"; \
	  echo 'VITE_API_URL=http://127.0.0.1:8000' > $(FRONT_DIR)/.env.local; \
	else \
	  echo "→ $(FRONT_DIR)/.env.local existe déjà, skip"; \
	fi

.PHONY: init-db
init-db: ## Crée les BDDs datashare (dev) + datashare_test (test) si absentes, puis applique les migrations
	cd $(API_DIR) && php bin/console doctrine:database:create --if-not-exists --no-interaction
	cd $(API_DIR) && APP_ENV=test php bin/console doctrine:database:create --if-not-exists --no-interaction
	cd $(API_DIR) && php bin/console doctrine:migrations:migrate --no-interaction
	cd $(API_DIR) && APP_ENV=test php bin/console doctrine:migrations:migrate --no-interaction

.PHONY: init-jwt
init-jwt: ## Génère la keypair RSA pour Lexik JWT (utilise la passphrase du .env.local)
	cd $(API_DIR) && php bin/console lexik:jwt:generate-keypair --skip-if-exists --no-interaction

.PHONY: init-storage
init-storage: ## Crée les dossiers de stockage (var/storage et var/storage_test)
	mkdir -p $(API_DIR)/var/storage $(API_DIR)/var/storage_test

# ============================================================================
# Lancement (dev)
# ============================================================================

.PHONY: back
back: ## Démarre le back Symfony en APP_ENV=test sur le port 8000 (avec endpoints /test/*)
	cd $(API_DIR) && APP_ENV=test symfony server:start --no-tls --port=8000

.PHONY: front
front: ## Démarre le front Vite en mode dev
	cd $(FRONT_DIR) && npm run dev

.PHONY: front-build
front-build: ## Build le front en mode prod (output dans front/dist)
	cd $(FRONT_DIR) && npm run build

.PHONY: front-preview
front-preview: ## Sert le build prod du front (port 4173) — pour Lighthouse
	cd $(FRONT_DIR) && npm run preview

# ============================================================================
# Tests
# ============================================================================

.PHONY: test-back
test-back: ## Run PHPUnit (toutes les classes : Unit + Integration + Functional)
	cd $(API_DIR) && APP_ENV=test php bin/phpunit

.PHONY: test-back-coverage
test-back-coverage: ## PHPUnit avec coverage HTML (rapport dans api/var/coverage)
	cd $(API_DIR) && APP_ENV=test php bin/phpunit --coverage-text --coverage-html var/coverage

.PHONY: test-front
test-front: ## Run Vitest (unit front)
	cd $(FRONT_DIR) && npx vitest run

.PHONY: test-front-coverage
test-front-coverage: ## Vitest avec coverage HTML (rapport dans front/coverage)
	cd $(FRONT_DIR) && npx vitest run --coverage

.PHONY: test-e2e
test-e2e: ## Cypress E2E (back + front doivent tourner)
	cd $(FRONT_DIR) && npx cypress run

.PHONY: test-all
test-all: test-back test-front test-e2e ## Run all the test suites

# ============================================================================
# Performance
# ============================================================================

.PHONY: perf-download
perf-download: ## k6 sur GET /api/share/{token}/download (50 VUs, 1 min)
	@cd $(API_DIR) && \
	  TOKEN=$$(APP_ENV=test php tests/perf/seed_perf_blob.php 1 2>/dev/null) && \
	  echo "→ Token seedé : $$TOKEN" && \
	  k6 run -e TOKEN="$$TOKEN" tests/perf/download.k6.js

.PHONY: lighthouse
lighthouse: ## Lighthouse sur /login et /register (preview server doit tourner sur :4173)
	mkdir -p docs/livrables/lighthouse
	npx -y lighthouse http://localhost:4173/login \
	  --only-categories=performance,accessibility,best-practices,seo \
	  --output=html --output-path=docs/livrables/lighthouse/login \
	  --chrome-flags="--headless --no-sandbox" --quiet
	npx -y lighthouse http://localhost:4173/register \
	  --only-categories=performance,accessibility,best-practices,seo \
	  --output=html --output-path=docs/livrables/lighthouse/register \
	  --chrome-flags="--headless --no-sandbox" --quiet
	@echo "→ Rapports : docs/livrables/lighthouse/{login,register}.report.html"

# ============================================================================
# Outillage
# ============================================================================

.PHONY: seed-demo
seed-demo: ## Crée un user demo + 7 fichiers fixtures dans datashare_test (idempotent)
	cd $(API_DIR) && APP_ENV=test php tests/fixtures/seed_files_demo.php

.PHONY: audit
audit: ## Scan sécurité npm + composer (full + prod-only)
	@echo "=== composer audit (back) ==="
	cd $(API_DIR) && composer audit
	@echo "=== composer audit --no-dev ==="
	cd $(API_DIR) && composer audit --no-dev
	@echo "=== npm audit (front) ==="
	cd $(FRONT_DIR) && npm audit
	@echo "=== npm audit --omit=dev ==="
	cd $(FRONT_DIR) && npm audit --omit=dev

.PHONY: clean-cypress-state
clean-cypress-state: ## Wipe BDD datashare_test (users + files + storage) — équivalent au cleanup Cypress
	curl -s -X POST http://127.0.0.1:8000/test/users/reset
	curl -s -X POST http://127.0.0.1:8000/test/files/reset
	@echo " ✅ État test reset"
