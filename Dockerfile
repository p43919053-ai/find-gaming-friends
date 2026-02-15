FROM php:8.2-apache

# 1. Обновляем Linux и ставим библиотеки для PostgreSQL (libpq-dev)
RUN apt-get update && apt-get install -y libpq-dev

# 2. Устанавливаем драйверы PHP для работы с PostgreSQL
RUN docker-php-ext-install pdo pdo_pgsql

# 3. Включаем красивые ссылки
RUN a2enmod rewrite

# 4. Копируем файлы сайта
COPY . /var/www/html/

# 5. Открываем порт
EXPOSE 80
