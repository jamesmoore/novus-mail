FROM alpine:latest as build

RUN apk add --no-cache nodejs npm

WORKDIR /app

COPY . /app

RUN npm install
RUN npm run build
RUN npm run bundle 

WORKDIR front-react

RUN npm install
RUN npm run build
RUN rm -rf node_modules

WORKDIR /app

FROM alpine:latest as runtime

RUN apk add --no-cache nodejs

WORKDIR /app

COPY --from=build /app/dist .
COPY --from=build /app/data ./data
COPY --from=build /app/front-react/dist ./front-react/dist

CMD ["node", "main.js"]
