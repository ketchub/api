# export COMPOSE_PROJECT_NAME = catchalongapi
# export HTTPS_PORT ?= 4434
#
# # Settings for this Makefile
# SHELL = /bin/bash
#
# BOX_1 = 162.243.2.183
# BOX_2 = 162.243.32.12
# BOX_3 = 192.241.183.201
#
# ################################################################################
# # Development related
# ################################################################################
# dev: export NODE_ENV = development
# dev: dev-setup
# 	docker-compose -f _docker/docker-compose.yml up -d
# 	docker-compose -f _docker/docker-compose.yml logs -f; true && \
# 	make dev-halt
#
# dev-halt: export NODE_ENV = development
# dev-halt:
# 	docker-compose -f _docker/docker-compose.yml down
#
# dev-setup:
# ifneq ($(wildcard ./node_modules/.*),)
# 	@echo "Initial setup complete; run make dev-npm-install to reinstall npm mods"
# else
# 	make dev-npm-install
# endif
#
# dev-npm-install: CONTAINER_NAME = $(COMPOSE_PROJECT_NAME)_intermediate
# dev-npm-install:
# 	echo "Setting up with intermediate container..."
# 	docker build -t $(CONTAINER_NAME) -f _docker/Dockerfile .
# 	docker run -it --rm -v $$PWD:/src $(CONTAINER_NAME) npm install && npm rebuild
# 	docker rmi $(CONTAINER_NAME)
# 	scp api-image.tar root@162.243.2.183:/tmp
#
# ################################################################################
# # Production related
# ################################################################################
# deploy:
# 	docker rmi ketch-deploy/api; true
# 	docker build -f _deploy/Dockerfile -t ketch-deploy/api .
# 	docker save ketch-deploy/api > ./api-image.tar
# 	docker rmi ketch-deploy/api; true
# 	scp api-image.tar root@$(BOX_1):/tmp
# 	scp api-image.tar root@$(BOX_2):/tmp
# 	scp api-image.tar root@$(BOX_3):/tmp
# 	@ssh root@$(BOX_1) 'bash -s' < _deploy/remotes.sh
# 	@ssh root@$(BOX_2) 'bash -s' < _deploy/remotes.sh
# 	@ssh root@$(BOX_3) 'bash -s' < _deploy/remotes.sh
# 	rm api-image.tar
#
# ################################################################################
# # Test related
# ################################################################################
# # test: export NODE_ENV = test
# test: dev-setup
# 	docker-compose -f _docker/docker-compose.yml up -d
# 	docker exec -it catchalongapi_apitest_1 ./node_modules/.bin/mocha
#
# # Reset database SCHEMA
# dev-db-reset: export NODE_ENV = development
# dev-db-reset:
# 	docker exec -it catchalongapi_api1_1 env TERM=xterm node ./bin/db.js
#
# # Seed the database
# dev-db-seed: export NODE_ENV = development
# dev-db-seed:
# 	docker exec -it catchalongapi_api1_1 env TERM=xterm node ./bin/db-seeder.js
#
# resetdb:
# 	make dev-db-reset
# 	make dev-db-seed
#
# # @todo: this is during INITIAL development; once seed data is in place this
# # should never be used!
# clean-seeds:
# 	rm -rf ./config/seeds/trip/*
# 	rm -rf ./config/seeds/account/*
#
# # nginx:
# # 	docker-compose -f _docker/docker-compose.yml run proxyway
# # 	# docker-compose -f _docker/docker-compose.yml run --no-deps proxyway
# #
# # nginx-logs:
# # 	docker-compose -f _docker/docker-compose.yml logs -f
