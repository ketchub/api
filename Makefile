export APP_NAME = catchalong-api

# Settings for this Makefile
SHELL = /bin/bash

dev: dev-compose-up
	docker-compose -f _docker/docker-compose.yml logs -f; true && \
	make dev-compose-down

dev-setup: dev-compose-up
	docker exec -it api1 npm install && npm rebuild && npm cache clean
	make dev

dev-compose-up:
	docker-compose -f _docker/docker-compose.yml up -d

dev-compose-down:
	docker-compose -f _docker/docker-compose.yml down
