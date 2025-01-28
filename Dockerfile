FROM alpine:latest

RUN apk add --no-cache nodejs npm

WORKDIR /app

COPY . /app

RUN npm install

WORKDIR front-react

RUN npm install && npm run build && rm -rf node_modules

WORKDIR /app

CMD ["node", "main.js"]
