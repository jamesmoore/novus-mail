FROM alpine:latest AS build

RUN apk add --no-cache nodejs npm

WORKDIR /app

COPY . /app

WORKDIR /app/api

RUN npm install
RUN npm run lint
RUN npm run build
RUN npm run bundle 

WORKDIR /app/front-react

RUN npm install
RUN npm run lint
RUN npm run build

WORKDIR /app

FROM alpine:latest AS runtime

RUN apk add --no-cache nodejs

WORKDIR /app

COPY --from=build /app/api/dist .
COPY --from=build /app/api/data ./data
COPY --from=build /app/front-react/dist ./front-react/dist

CMD ["node", "index.js"]
