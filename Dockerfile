FROM alpine:latest AS build

RUN apk add --no-cache nodejs npm

WORKDIR /app

COPY . /app

RUN npm install
RUN npm run build
RUN npm run bundle 

WORKDIR front-react

RUN npm install
RUN npm run lint
RUN npm run build

WORKDIR /app

FROM alpine:latest AS runtime

RUN apk add --no-cache nodejs

WORKDIR /app

COPY --from=build /app/dist .
COPY --from=build /app/data ./data
COPY --from=build /app/front-react/dist ./front-react/dist

CMD ["node", "index.js"]
