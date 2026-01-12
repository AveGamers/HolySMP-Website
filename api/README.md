# HolySMP Shop API

Backend API für den HolySMP Shop - fungiert als Proxy für die Tebex API.

## Installation

```bash
npm install
```

## Konfiguration

Erstelle eine `.env` Datei basierend auf `.env.example`:

```bash
cp .env.example .env
```

Passe die Werte in der `.env` Datei an.

## Entwicklung

```bash
npm run dev
```

Server läuft auf: `http://localhost:3000`

## Produktion

```bash
npm start
```

## API Endpoints

### GET /health
Health Check - Überprüft ob der Server läuft

### GET /api/categories
Alle Shop-Kategorien abrufen

### GET /api/packages
Alle Shop-Pakete abrufen

### GET /api/packages/:id
Einzelnes Paket nach ID abrufen

### POST /api/basket
Warenkorb erstellen

Body:
```json
{
  "packages": [
    {
      "id": 12345,
      "quantity": 1
    }
  ]
}
```

### GET /api/info
Webstore Informationen abrufen

## Deployment mit Reverse Proxy

### Nginx Konfiguration

```nginx
server {
    listen 80;
    server_name web-api.holysmp.net;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### PM2 (Empfohlen für Produktion)

```bash
npm install -g pm2
pm2 start server.js --name holysmp-shop-api
pm2 save
pm2 startup
```

## Umgebungsvariablen

- `TEBEX_WEBSTORE_ID` - Deine Tebex Webstore ID
- `TEBEX_PROJECT_ID` - Deine Tebex Projekt ID
- `TEBEX_PUBLIC_TOKEN` - Dein Tebex Public Token
- `PORT` - Server Port (Standard: 3000)
- `NODE_ENV` - Umgebung (development/production)
- `ALLOWED_ORIGINS` - Erlaubte CORS Origins (comma-separated)
