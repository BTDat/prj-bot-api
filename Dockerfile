FROM node:14.17.1-alpine
ENV CHROME_BIN="/usr/bin/chromium-browser" \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true"
RUN set -x \
    && apk update \
    && apk upgrade \
    && apk add --no-cache \
    udev \
    ttf-freefont \
    chromium \
    && npm install puppeteer@11.0.0
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