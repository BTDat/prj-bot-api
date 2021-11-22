FROM node:14.17.1-alpine
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
USER node
COPY package*.json ./
RUN npm install
COPY --chown=node:node . .
RUN mv .env.staging .env
RUN npm run build
# EXPOSE 3001
CMD NODE_ENV=production node ./dist/index.js