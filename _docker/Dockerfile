# Don't use "base-6.7" for development because it doesn't come with NPM;
# but we want to use it for production.
# FROM mhart/alpine-node:base-6.7
FROM mhart/alpine-node:6.7.0

# Use NPM2 as the process manager
# RUN npm install pm2 -g

# Set the working directory
WORKDIR /src

# In production, we do want to add all files and bundle err'thang
# ADD . .

# Expose the port 3000
EXPOSE 3000

# Allow the entry point to be customized for dev...
# ENTRYPOINT ["npm"]
