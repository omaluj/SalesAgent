# 🔐 **OAuth 2.0 Setup Guide**

## **Prečo OAuth 2.0?**

- ✅ **Stabilné** - nezávisí od Domain-wide Delegation
- ✅ **Bezpečné** - užívateľ má kontrolu
- ✅ **Jednoduché** - menej nastavení
- ✅ **Flexibilné** - môže používať rôzne účty

## **Krok 1: Vytvoriť OAuth 2.0 Client**

### **1. Google Cloud Console**
1. Choďte na [Google Cloud Console](https://console.cloud.google.com)
2. Vyberte projekt: **salesagent-470115**
3. **APIs & Services** → **Credentials**
4. **Create Credentials** → **OAuth 2.0 Client IDs**

### **2. Nastavenia OAuth Client**
- **Application type**: Web application
- **Name**: Biz-Agent OAuth Client
- **Authorized redirect URIs**: 
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/oauth2callback`

### **3. Stiahnuť credentials**
- Kliknite na vytvorený OAuth Client
- **Download JSON**
- Uložte ako: `credentials/oauth-client.json`

## **Krok 2: Implementácia OAuth Flow**

### **1. Environment Variables**
```bash
# V .env súbore
GOOGLE_OAUTH_CLIENT_ID="your-oauth-client-id"
GOOGLE_OAUTH_CLIENT_SECRET="your-oauth-client-secret"
GOOGLE_OAUTH_REDIRECT_URI="http://localhost:3000/auth/callback"
```

### **2. OAuth Flow**
1. **Užívateľ sa prihlási** do sales@domelia.sk
2. **Google pošle authorization code**
3. **Biz-Agent vymení code za access token**
4. **Access token sa uloží** pre budúce použitie

## **Krok 3: Testovanie**

```bash
# Test OAuth flow
npm run test:oauth

# Test Gmail s OAuth
npm run test:gmail

# Test Calendar s OAuth
npm run test:public-calendar
```

## **Výhody OAuth 2.0**

### **Oproti Service Account:**
- ✅ **Žiadne Domain-wide Delegation**
- ✅ **Žiadne admin nastavenia**
- ✅ **Automatické obnovenie tokenov**
- ✅ **Bezpečnejšie**

### **Workflow:**
1. **Prvýkrát**: Užívateľ sa prihlási
2. **Následne**: Automatické používanie
3. **Token expiruje**: Automatické obnovenie

## **Implementácia**

### **1. OAuth Service**
```typescript
// src/modules/auth/oauth.service.ts
export class OAuthService {
  async getAuthUrl(): Promise<string>
  async handleCallback(code: string): Promise<void>
  async refreshToken(): Promise<void>
  async isAuthenticated(): Promise<boolean>
}
```

### **2. Token Storage**
```typescript
// Tokens sa ukladajú do databázy
interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scope: string[];
}
```

### **3. Gmail/Calendar Integration**
```typescript
// Používa OAuth tokens namiesto Service Account
const auth = new google.auth.OAuth2(
  clientId,
  clientSecret,
  redirectUri
);
auth.setCredentials(tokens);
```

## **Nasadenie**

### **Development:**
```bash
npm run dev
# Otvorí OAuth flow v prehliadači
```

### **Production:**
```bash
npm run build
npm start
# OAuth flow cez web UI
```

## **Bezpečnosť**

### **Token Management:**
- **Access tokens**: Krátkodobé (1 hodina)
- **Refresh tokens**: Dlhodobé (až 6 mesiacov)
- **Automatické obnovenie**: Pred expiráciou
- **Bezpečné uloženie**: V databáze, šifrované

### **Scopes:**
```
https://www.googleapis.com/auth/gmail.send
https://www.googleapis.com/auth/gmail.compose
https://www.googleapis.com/auth/calendar
https://www.googleapis.com/auth/calendar.events
```
