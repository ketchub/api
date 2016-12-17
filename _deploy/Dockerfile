FROM mhart/alpine-node:base-6.7

WORKDIR /app

ADD ./app app/
ADD ./node_modules node_modules/
ADD ./pm2process.yml pm2process.yml

ENV NODE_ENV=production \
    RETHINK_HOST=0.0.0.0

cmd ["./node_modules/.bin/pm2-docker", "/app/pm2process.yml"]
