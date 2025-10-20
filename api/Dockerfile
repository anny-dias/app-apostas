FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci || npm i

COPY . .

# usuário não-root
RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 8080
CMD ["node","index.js"]
