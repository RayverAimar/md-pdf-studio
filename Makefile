# md-pdf-studio — developer commands. Thin wrappers over pnpm + Turborepo.
.DEFAULT_GOAL := help
.PHONY: help setup install chrome dev dev-desktop dev-app build lint format typecheck test check clean

help: ## Show this help
	@grep -hE '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-13s\033[0m %s\n", $$1, $$2}'

setup: install chrome ## Install dependencies + the Chromium used for PDF export

install: ## Install workspace dependencies
	pnpm install

chrome: ## Download the Chromium build Puppeteer uses for web PDF export
	pnpm --filter @md-pdf-studio/web exec puppeteer browsers install chrome

dev: ## Run the web app (Next.js) at http://localhost:3000
	pnpm dev:web

dev-desktop: ## Run the desktop app (Electron)
	pnpm dev:desktop

dev-app: ## Run web + desktop together
	pnpm dev:app

build: ## Build every package and app
	pnpm build

lint: ## Lint + format check (Biome)
	pnpm lint

format: ## Auto-format and apply safe fixes (Biome)
	pnpm lint:fix

typecheck: ## Type-check every package (tsc, no emit)
	pnpm typecheck

test: ## Run the test suites (Vitest)
	pnpm test

check: lint typecheck test ## Run lint + typecheck + tests (the pre-commit gate)

clean: ## Remove build outputs and caches
	rm -rf .turbo apps/web/.next apps/desktop/dist packages/*/dist
