# Backoffice API image. Fly builds this remotely (no local Docker needed).
# node:22-slim: node:sqlite works unflagged on Node 22.22+.
FROM node:22-slim

WORKDIR /app

# Install only runtime deps (tsx is a dependency so `npm start` works).
COPY package.json ./
RUN npm install --omit=dev

COPY . .

ENV NODE_ENV=production
# PORT, DB_PATH and UPLOADS_DIR are provided by fly.toml [env] at runtime.
EXPOSE 8080

CMD ["npm", "start"]
