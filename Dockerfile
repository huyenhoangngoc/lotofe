FROM node:lts-alpine AS build

ARG VITE_API_URL=/api
ARG VITE_SIGNALR_URL=/hubs/game
ARG VITE_GOOGLE_CLIENT_ID

ENV NPM_CONFIG_UPDATE_NOTIFIER=false
ENV NPM_CONFIG_FUND=false
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SIGNALR_URL=$VITE_SIGNALR_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . ./
RUN npm run build

FROM caddy

WORKDIR /app

COPY Caddyfile ./
RUN caddy fmt Caddyfile --overwrite

COPY --from=build /app/dist ./

CMD ["caddy", "run", "--config", "Caddyfile", "--adapter", "caddyfile"]
