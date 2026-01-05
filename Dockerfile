FROM alpine:latest AS build

RUN apk add --no-cache nodejs npm

# ---------- Backend ----------
WORKDIR /app/api

COPY api/package*.json ./
RUN npm install

COPY api ./

RUN npm run lint
RUN npm run build
RUN npm prune --omit=dev

# ---------- Frontend ----------
WORKDIR /app/front-react

COPY front-react/package*.json ./
RUN npm install

COPY front-react ./

RUN npm run lint
RUN npm run build

# ---------- Runtime ----------
FROM alpine:latest AS runtime

RUN apk add --no-cache nodejs

WORKDIR /app

COPY --from=build /app/api/dist ./dist
COPY --from=build /app/api/node_modules ./node_modules
COPY --from=build /app/api/package.json ./package.json
COPY --from=build /app/api/data ./data
COPY --from=build /app/front-react/dist ./front-react/dist

CMD ["node", "dist/main.js"]
