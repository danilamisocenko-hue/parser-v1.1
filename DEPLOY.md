# Инструкция по деплою (VPS + DuckDNS)

Этот проект разделен на 3 части:
1. **Web / API** (Сайт и серверная часть)
2. **Bot** (Telegram бот для уведомлений)
3. **Desktop** (Приложение для Windows, которое делает тяжелый парсинг)

---

## 1. Настройка DuckDNS
1. Зайдите на [duckdns.org](https://www.duckdns.org/).
2. Авторизуйтесь и создайте домен (например, `my-parser-test`).
3. В колонке `IP` укажите IP-адрес вашего VPS.
4. Теперь ваш сервер доступен по адресу `my-parser-test.duckdns.org`.

---

## 2. Подготовка VPS (Ubuntu/Debian)
Выполните команды на сервере:

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Node.js (рекомендуется v20+)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Установка PM2 (менеджер процессов для автозапуска)
sudo npm install -g pm2
```

---

## 3. Запуск Сайта и Сервера
1. Скопируйте файлы проекта на сервер.
2. Установите зависимости: `npm install`.
3. Соберите проект: `npm run build`.
4. Запустите сервер через PM2:
```bash
pm2 start dist-server/server.js --name "web-api"
```

---

## 4. Запуск Telegram Бота
1. Создайте `.env` файл в корне и добавьте `TELEGRAM_BOT_TOKEN`.
2. Запустите бота:
```bash
pm2 start npx tsx bot/index.ts --name "parser-bot"
```

---

## 5. Desktop Приложение
Для десктопа не нужен VPS. Вы запускаете его на своем компьютере:
1. Выполните сборку: `npm run dist`.
2. В папке `dist-electron` появится установщик `.exe`.
3. Установите и пользуйтесь. Он будет подключаться к API по адресу вашего DuckDNS.

---

## 6. Сохранение процессов PM2
Чтобы после перезагрузки сервера всё стартовало само:
```bash
pm2 save
pm2 startup
```
