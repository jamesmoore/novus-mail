FROM alpine:latest

RUN apk add --no-cache nodejs npm

WORKDIR /app

COPY . /app

RUN npm install

WORKDIR front-react

RUN npm install
RUN npm run build

WORKDIR /app

CMD ["node", "main.js"]
