FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
COPY public ./public
RUN apk add --no-cache tzdata
ENV NODE_ENV=production DB_PATH=/data/estoque.db PORT=3000 TZ=America/Sao_Paulo
VOLUME ["/data"]
EXPOSE 3000
CMD ["npm", "start"]
