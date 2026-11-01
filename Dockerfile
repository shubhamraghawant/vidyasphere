FROM node:22-alpine

WORKDIR /app

# Install build dependencies for sqlite3 native compile if needed
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Seed initial database on first run
RUN node scripts/seed.js

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

CMD ["node", "server.js"]
