FROM php:8.2-apache

# 1. Устанавливаем библиотеки для работы с PostgreSQL
RUN apt-get update && apt-get install -y libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql

# 2. Включаем красивые ссылки
RUN a2enmod rewrite

# 3. Копируем файлы сайта
COPY . /var/www/html/

# 4. Открываем порт
EXPOSE 80
