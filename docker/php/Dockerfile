FROM php:8.4-fpm-alpine

# Installation des dépendances système nécessaires
RUN apk add --no-cache \
    bash \
    curl \
    git \
    icu-dev \
    libpq-dev \
    libzip-dev \
    unzip \
    zip

# Installation et activation des extensions PHP requises par Symfony et PostgreSQL
RUN docker-php-ext-configure intl \
    && docker-php-ext-install -j$(nproc) \
        intl \
        opcache \
        pdo \
        pdo_pgsql \
        zip

# Installation de Composer depuis l'image officielle
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Répertoire de travail
WORKDIR /var/www/backend

EXPOSE 9000

CMD ["php-fpm"]
