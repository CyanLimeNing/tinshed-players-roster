# ---- build stage: install production dependencies only ----
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- runtime stage: small, no build tooling ----
FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
COPY public ./public
RUN mkdir -p /app/data && chown node:node /app/data
# SQLite data lives on a volume so it survives container restarts.
VOLUME ["/app/data"]
ENV DB_PATH=/app/data/tinshed.db
ENV HOST=0.0.0.0
EXPOSE 3000
USER node
CMD ["node", "src/server.js"]
