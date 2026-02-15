FROM php:8.2-apache

# 1. Обновляем систему и ставим библиотеки для PostgreSQL
RUN apt-get update && apt-get install -y libpq-dev

# 2. Устанавливаем драйверы PHP (PDO и Postgres)
RUN docker-php-ext-install pdo pdo_pgsql

# 3. Копируем файлы сайта внутрь контейнера
COPY . /var/www/html/

# 4. Открываем порт для интернета
EXPOSE 80
