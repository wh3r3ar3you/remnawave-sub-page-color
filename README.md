# Remnawave Subscription Page Color

Небольшая Docker-обёртка над официальным образом `remnawave/subscription-page`, которая добавляет настройку оформления через переменные окружения.

Проект не форкает исходники Remnawave Subscription Page. Он берёт официальный образ как базовый, на старте контейнера генерирует CSS с выбранной палитрой и подключает его к уже собранному фронтенду.

## Возможности

- Выбор темы через `.env`
- Поддержка готовых цветов: `white`, `red`, `orange`, `yellow`, `green`, `cyan`, `blue`, `purple`, `pink`
- Поддержка hex-палитры: `000000`, `#000000`, `ff00aa`, `#ff00aa`
- Отдельные цвета для фона, верхней панели, основного блока и акцентов
- Опциональная favicon-иконка через `BRANDING_ICON_URL`
- Увеличенный логотип в верхней панели
- Сохранение штатной логики и конфигурации Remnawave Subscription Page

## Быстрый старт

Скопируйте пример окружения:

```bash
cp .env.example .env
```

Откройте `.env` и укажите адрес панели Remnawave и API-токен:

```env
REMNAWAVE_PANEL_URL=https://your-panel.example.com
REMNAWAVE_API_TOKEN=your_api_token
```

Запустите контейнер:

```bash
docker compose up -d
```

По умолчанию страница будет доступна на:

```text
http://127.0.0.1:3010
```

## Настройка цвета

Самый простой вариант:

```env
THEME_COLOR=purple
```

Доступные имена цветов:

```text
white red orange yellow green cyan blue purple pink
```

Можно передать любой hex-цвет:

```env
THEME_COLOR=000000
```

или:

```env
THEME_COLOR=#000000
```

Короткий hex тоже поддерживается:

```env
THEME_COLOR=f0a
```

## Цвета по секциям

Если одного основного цвета мало, можно настроить отдельные части интерфейса:

```env
THEME_ACCENT_COLOR=8b5cf6
THEME_ACCENT_2_COLOR=ec4899
THEME_SOFT_COLOR=c4b5fd
THEME_BACKGROUND_COLOR=070312
THEME_HEADER_COLOR=0b0718
THEME_MAIN_COLOR=0a0617
```

Что делает каждая переменная:

- `THEME_ACCENT_COLOR` — основной акцент, кнопки, активные элементы
- `THEME_ACCENT_2_COLOR` — дополнительный акцент для градиентов
- `THEME_SOFT_COLOR` — мягкая подсветка, бордеры, линии
- `THEME_BACKGROUND_COLOR` — общий фон страницы
- `THEME_HEADER_COLOR` — верхняя панель
- `THEME_MAIN_COLOR` — основной блок с контентом подписки

Все переменные цвета принимают `RGB` или `RRGGBB`, с `#` или без.

## Favicon

По умолчанию используется штатная favicon из базового образа.

Чтобы задать свою иконку для вкладки браузера:

```env
BRANDING_ICON_URL=https://example.com/icon.png
```

Подойдут `png`, `ico` и `svg`. Для вкладок браузера обычно надёжнее всего работают `png` или `ico`.

Если favicon не меняется сразу, браузер мог закешировать старую иконку. Откройте страницу в новой вкладке или очистите site data для домена.

## Пример `.env`

```env
APP_PORT=3010
THEME_COLOR=000000
THEME_HEADER_COLOR=111111
THEME_MAIN_COLOR=090909
THEME_BACKGROUND_COLOR=000000
BRANDING_ICON_URL=https://example.com/icon.png
REMNAWAVE_PANEL_URL=https://your-panel.example.com
REMNAWAVE_API_TOKEN=your_api_token
```

## Порт

В `docker-compose.yml` по умолчанию порт проброшен только на localhost:

```yaml
ports:
  - "127.0.0.1:3010:3010"
```

Если нужно открыть страницу наружу:

```yaml
ports:
  - "3010:3010"
```

## Сборка

Обычно сборка не нужна: `docker-compose.yml` использует готовый образ из Docker Hub:

```text
intoxxx/remnawave-sub-page-color:latest
```

Если нужно собрать образ локально:

```bash
docker build -t remnawave/subscription-page:purple -f docker/Dockerfile .
```

Локальный тег после ручной сборки:

```text
remnawave/subscription-page:purple
```

## Экспорт образа

Если образ собран локально, его можно сохранить в архив:

```bash
docker save remnawave/subscription-page:purple | gzip > remnawave-subscription-page-theme-env.tar.gz
```

Загрузить на другом сервере:

```bash
docker load -i remnawave-subscription-page-theme-env.tar.gz
```

После загрузки можно запускать через этот же `docker-compose.yml`.

## Безопасность

Файл `.env` не должен попадать в git. В репозитории есть только `.env.example` с шаблонными значениями.

Не публикуйте `REMNAWAVE_API_TOKEN`, архивы образов и локальные файлы с приватными ссылками.
