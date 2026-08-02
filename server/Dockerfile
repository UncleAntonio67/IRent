FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src

RUN mkdir -p /app/uploads

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "src/index.js"]
