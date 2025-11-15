# Инструкция по запуску бота 

## 1. Клонировать репозиторий и перейти в него
git clone https://github.com/Holga25/calorie-bot.git

cd calorie-bot

## 2. Запуск через Docker Compose
### Сборка и запуск
docker-compose up -d --build
### Остановка бота
docker-compose down
### Перезапуск
docker-compose restart

## 3. Запуск через Docker
### Сборка образа
docker build -t calorie-bot .
### Запуск контейнера
docker run -d --name calorie-bot --restart unless-stopped -v "%CD%/data:/app/data" --env-file .env calorie-bot
### Остановить контейнер
docker stop calorie-bot
### Удалить контейнер
docker rm calorie-bot

## 4. Запуск через командную строку
### Установка зависимостей
npm install
### Сборка проекта
npm run build
### Запуск бота
npm run bot
### Остановка бота
Ctrl + C

# Проверка работоспособности
### После запуска:
  - Откройте MAX
  - Найдите бота по username
  - Начните общение или отправьте команду /start
  - Следуйте инструкциям бота для регистрации и расчета калорий
