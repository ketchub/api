export COMPOSE_PROJECT_NAME = catchalongapi
export HTTPS_PORT ?= 4434

# Settings for this Makefile
SHELL = /bin/bash

################################################################################
# Development related
################################################################################
# dev: export NODE_ENV = development
dev: dev-setup
	docker-compose -f _docker/docker-compose.yml up -d
	docker-compose -f _docker/docker-compose.yml logs -f; true && \
	make dev-halt

dev-halt:
	docker-compose -f _docker/docker-compose.yml down

dev-setup:
ifneq ($(wildcard ./node_modules/.*),)
	@echo "Initial setup complete; run make dev-npm-install to reinstall npm mods"
else
	make dev-npm-install
endif

dev-npm-install: CONTAINER_NAME = $(COMPOSE_PROJECT_NAME)_intermediate
dev-npm-install:
	echo "Setting up with intermediate container..."
	docker build -t $(CONTAINER_NAME) -f _docker/Dockerfile .
	docker run -it --rm -v $$PWD:/src $(CONTAINER_NAME) npm install && npm rebuild
	docker rmi $(CONTAINER_NAME)

################################################################################
# Production related
################################################################################


################################################################################
# Test related
################################################################################
# test: export NODE_ENV = test
test: dev-setup
	docker-compose -f _docker/docker-compose.yml up -d
	docker exec -it catchalongapi_apitest_1 ./node_modules/.bin/mocha

nginx:
	docker-compose -f _docker/docker-compose.yml run proxyway
	# docker-compose -f _docker/docker-compose.yml run --no-deps proxyway

nginx-logs:
	docker-compose -f _docker/docker-compose.yml logs -f
