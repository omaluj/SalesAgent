# Email Testing Guide

## Prehľad

Tento dokument popisuje, ako testovať emailovú funkcionalitu v Biz-Agent aplikácii.

## Testovacie možnosti

### 1. Mock Email Service (Odporúčané pre testovanie)

**Výhody:**
- ✅ Rýchle testovanie bez skutočného odosielania
- ✅ Žiadne náklady na emailové služby
- ✅ Simuluje úspešné aj neúspešné odosielanie
- ✅ Loguje všetky testy do konzoly

**Použitie:**
- V UI: Zaškrtnite "Použiť mock službu (testovací režim)"
- V API: Nastavte `"useMock": true`

### 2. Skutočná Mailjet Service

**Výhody:**
- ✅ Skutočné odosielanie emailov
- ✅ Testovanie s reálnymi emailovými adresami
- ✅ Overenie doručiteľnosti

**Použitie:**
- V UI: Odškrtnite "Použiť mock službu"
- V API: Nastavte `"useMock": false`

## Testovacie emailové adresy

### Odporúčané testovacie služby:

1. **Mailtrap.io** (Odporúčané)
   - URL: https://mailtrap.io
   - Bezplatný plán: 100 emailov/mesiac
   - Vytvorte testovaciu schránku pre Domelia.sk

2. **MailHog** (Lokálne testovanie)
   - URL: https://github.com/mailhog/MailHog
   - Lokálny SMTP server pre testovanie
   - Web UI na prezeranie emailov

3. **Gmail Test Account**
   - Vytvorte testovací Gmail účet
   - Použite pre testovanie doručiteľnosti

## Ako testovať

### 1. Cez UI Dashboard

1. Otvorte http://localhost:3000/
2. Kliknite na "Test Email" kartu
3. Vyplňte formulár:
   - **Email adresa**: test@example.com
   - **Predmet**: Test email z Domelia.sk
   - **Obsah**: `<h1>Test</h1><p>Testovací email</p>`
   - **Mock služba**: Zaškrtnuté (odporúčané)
4. Kliknite "Odoslať test email"

### 2. Cez API

```bash
# Test s mock službou
curl -X POST http://localhost:3001/api/dashboard/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test email z Domelia.sk",
    "content": "<h1>Test email</h1><p>Toto je test email z Domelia.sk</p>",
    "useMock": true
  }'

# Test so skutočnou Mailjet službou
curl -X POST http://localhost:3001/api/dashboard/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-test-email@example.com",
    "subject": "Test email z Domelia.sk",
    "content": "<h1>Test email</h1><p>Toto je test email z Domelia.sk</p>",
    "useMock": false
  }'
```

### 3. Kontrola stavu emailových služieb

```bash
curl -s http://localhost:3001/api/dashboard/email-status | jq
```

## Konfigurácia Mailjet

### Pre skutočné odosielanie emailov:

1. Vytvorte účet na https://mailjet.com
2. Získajte API kľúče
3. Nastavte v `.env` súbore:

```env
MAILJET_API_KEY="your_mailjet_api_key_here"
MAILJET_API_SECRET="your_mailjet_api_secret_here"
MAILJET_SENDER_EMAIL="noreply@domelia.sk"
MAILJET_SENDER_NAME="Domelia.sk"
```

## Testovacie scenáre

### 1. Základný test
- Odoslať jednoduchý HTML email
- Overiť úspešné odoslanie
- Skontrolovať logy

### 2. Test s rôznymi obsahmi
- HTML s obrázkami
- Textový obsah
- Špeciálne znaky (slovenčina)

### 3. Test chybových stavov
- Neplatná emailová adresa
- Prázdny obsah
- Chýbajúce povinné polia

### 4. Test výkonu
- Hromadné odosielanie
- Rate limiting
- Timeout handling

## Logy a monitoring

### Kde nájsť logy:
- **Backend logy**: `backend/logs/biz-agent-dev.log`
- **Konzola**: Pri spustení v development móde
- **API response**: Vráti messageId a status

### Čo sledovať:
- Úspešné odosielanie
- Chybové správy
- Performance metriky
- Rate limiting

## Troubleshooting

### Časté problémy:

1. **"Mailjet not initialized"**
   - Skontrolujte API kľúče v `.env`
   - Reštartujte backend

2. **"Email failed to send"**
   - Skontrolujte emailovú adresu
   - Overte obsah emailu
   - Skontrolujte logy pre detailnú chybu

3. **"Mock service not working"**
   - Reštartujte backend
   - Skontrolujte konzolu pre logy

### Debug kroky:

1. Skontrolujte stav služieb:
   ```bash
   curl -s http://localhost:3001/api/dashboard/email-status | jq
   ```

2. Skontrolujte logy:
   ```bash
   tail -f backend/logs/biz-agent-dev.log
   ```

3. Testujte s mock službou najprv

## Bezpečnosť

### Dôležité poznámky:
- ✅ Nikdy neposielajte test emaily na skutočné zákaznícke adresy
- ✅ Používajte testovacie emailové adresy
- ✅ Chráňte API kľúče v `.env` súbore
- ✅ Pravidelne rotujte API kľúče

### Testovacie emailové adresy:
- `test@example.com`
- `noreply@domelia.sk`
- `dev@domelia.sk`
- Vlastné testovacie adresy

## Ďalšie zdroje

- [Mailjet API Documentation](https://dev.mailjet.com/)
- [Email Testing Best Practices](https://sendgrid.com/blog/email-testing-best-practices/)
- [SMTP Testing Tools](https://www.smtper.net/)
