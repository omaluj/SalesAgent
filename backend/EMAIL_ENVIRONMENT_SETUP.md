# Email Environment Setup

## Prehľad

Aplikácia teraz automaticky prepína medzi rôznymi email službami podľa environment:

- **Development (localhost)**: SMTP (MailHog) → Mock fallback
- **Production**: Gmail → Mailjet fallback

## Konfigurácia

### Development Environment (localhost)

**Email služba**: SMTP (MailHog)
**Fallback**: Mock service

#### Nastavenie MailHog:

1. **Spustite MailHog**:
```bash
# Spustite MailHog v pozadí
mailhog &

# Alebo s konkrétnymi portmi
mailhog -api-bind-addr 127.0.0.1:8025 -smtp-bind-addr 127.0.0.1:1025 -ui-bind-addr 127.0.0.1:8025
```

2. **Otvorte webové rozhranie**:
```bash
open http://localhost:8025
```

3. **Testovanie**:
```bash
curl -X POST http://localhost:3001/api/dashboard/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@localhost",
    "subject": "Test MailHog",
    "content": "<h1>Test MailHog</h1><p>Lokálny test</p>",
    "emailService": "auto"
  }'
```

### Production Environment

**Email služba**: Gmail
**Fallback**: Mailjet

#### Nastavenie Gmail:

1. **OAuth 2.0 nastavenie** (už nakonfigurované)
2. **Testovanie**:
```bash
curl -X POST http://localhost:3001/api/dashboard/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "sales@domelia.sk",
    "subject": "Test Gmail",
    "content": "<h1>Test Gmail</h1><p>Produkčný test</p>",
    "emailService": "auto"
  }'
```

## Automatické prepínanie

### Email Queue (Kampane)

Email queue automaticky vyberá službu podľa `NODE_ENV`:

```typescript
// Production: Gmail → Mailjet fallback
if (gmailService.isReady() && config.app.nodeEnv === 'production') {
  // Použije Gmail
} else if (mailjetService.isReady() && config.app.nodeEnv === 'production') {
  // Fallback na Mailjet
}

// Development: SMTP (MailHog) → Mock fallback
if (config.app.nodeEnv === 'development') {
  // Použije SMTP (MailHog)
  // Ak SMTP zlyhá, použije Mock
}
```

### Test Endpoint

Test endpoint podporuje automatické prepínanie:

```bash
# Automaticky vyberie službu podľa NODE_ENV
curl -X POST http://localhost:3001/api/dashboard/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Auto test",
    "content": "<h1>Auto</h1><p>Automatický výber služby</p>",
    "emailService": "auto"
  }'
```

## Manuálne prepínanie

Môžete manuálne špecifikovať službu:

```bash
# MailHog (SMTP)
"emailService": "smtp"

# Gmail
"emailService": "gmail"

# Mailjet
"emailService": "mailjet"

# Mock
"emailService": "mock"
```

## Environment Variables

### Development (.env.development)
```env
NODE_ENV="development"
DEBUG_MODE=true
SKIP_RATE_LIMITING=true
```

### Production (.env.production)
```env
NODE_ENV="production"
DEBUG_MODE=false
SKIP_RATE_LIMITING=false
```

## Logovanie

Aplikácia loguje akú službu použila:

```
[INFO] Email sent via SMTP (MailHog) - Development
[INFO] Email sent via Gmail - Production
[INFO] Email simulated (SMTP failed, using mock) - Development fallback
```

## Testovanie

### 1. Development Test (MailHog)

```bash
# Spustite MailHog
mailhog &

# Otestujte
curl -X POST http://localhost:3001/api/dashboard/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@localhost",
    "subject": "Development Test",
    "content": "<h1>Development</h1><p>MailHog test</p>",
    "emailService": "auto"
  }'

# Skontrolujte v MailHog UI
open http://localhost:8025
```

### 2. Production Test (Gmail)

```bash
# Otestujte (musíte mať nastavené Gmail OAuth)
curl -X POST http://localhost:3001/api/dashboard/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "sales@domelia.sk",
    "subject": "Production Test",
    "content": "<h1>Production</h1><p>Gmail test</p>",
    "emailService": "auto"
  }'
```

## Troubleshooting

### MailHog nefunguje
- Skontrolujte či beží na porte 1025
- Skontrolujte logy: `SMTP not initialized`

### Gmail nefunguje
- Skontrolujte OAuth nastavenie
- Skontrolujte logy: `Gmail not initialized`

### Fallback funguje
- V development: SMTP → Mock
- V production: Gmail → Mailjet
