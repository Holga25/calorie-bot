FROM node:18-alpine

WORKDIR /app

# Установка зависимостей для better-sqlite3
RUN apk add --no-cache python3 make g++

# Копируем package files
COPY package*.json ./
COPY tsconfig.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код
COPY src/ ./src/
RUN echo "BOT_TOKEN=f9LHodD0cOK8coJ-y296eYnl0TNS_9vdCtycguzRScMR7e2FkEWEXLAZ32xMa1ZEAAvd_-ctajxyFkVrYbi2" > .env

# Создаем папку для базы данных
RUN mkdir -p data

# Создаем volume для данных
VOLUME ["/app/data"]

# Запускаем бота
CMD ["npm", "run", "bot"]