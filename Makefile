export APP_NAME = catchalong-api

# Settings for this Makefile
SHELL = /bin/bash

dev: dev-setup
	docker-compose -f _docker/docker-compose.yml up -d
	docker-compose -f _docker/docker-compose.yml logs -f; true && \
	docker-compose -f _docker/docker-compose.yml down

dev-setup:
ifneq ($(wildcard ./node_modules/.*),)
	@echo "Initial setup complete; run make dev-npm-install to reinstall npm mods"
else
	make dev-npm-install
endif

# @todo: what if the container tag "intermediate" interferes with something?
dev-npm-install:
	echo "Setting up with intermediate container..."
	docker build -t intermediate -f _docker/Dockerfile .
	docker run -it --rm -v $$PWD:/src intermediate npm install && npm rebuild
	docker rmi intermediate
