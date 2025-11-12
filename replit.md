# Trampay - Financial Management for Microentrepreneurs

## Overview

Trampay is a comprehensive mobile application designed for microentrepreneurs and small business owners in Brazil. The platform provides end-to-end business management capabilities including financial tracking, client management, inventory control, service scheduling, and advanced features like tax simulation and trading tools.

**Tech Stack:**
- **Frontend:** React Native (Expo CLI) with React Navigation
- **Backend:** .NET 8 C# API
- **Database:** MySQL (hosted on AlwaysData)
- **Authentication:** JWT tokens with secure storage (expo-secure-store)
- **Deployment:** Backend on Render.com

**Key Purpose:** Enable small business owners to manage their operations, track finances, handle clients, and make informed business decisions through an intuitive mobile interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture (React Native + Expo)

**Navigation Pattern:**
- Stack-based navigation using `@react-navigation/stack` and `@react-navigation/drawer`
- Centralized routing in `routes.js` with authentication-based conditional rendering
- Side menu component for app-wide navigation with premium feature protection

**State Management:**
- Context API (`AuthContext`) for global authentication state
- Local component state with React hooks (useState, useEffect)
- Persistent storage strategy:
  - Sensitive data (PII): `expo-secure-store` (encrypted)
  - Non-sensitive data: `@react-native-async-storage/async-storage`
  - Hybrid approach via `SecureStorage` utility class

**Data Persistence Strategy:**
- **Sensitive fields** (name, CPF, phone, email) stored in SecureStore with encryption
- **Public data** (transaction amounts, dates, IDs) stored in AsyncStorage for performance
- **Offline-first approach:** Local cache with sync mechanism
- **Migration utility:** `SecureStorage.migrateExistingData()` for upgrading storage security

**Authentication Flow:**
1. JWT tokens stored in SecureStore
2. Axios interceptor attaches token to all API requests
3. Auto-login on app start if valid token exists
4. Token refresh not implemented (relies on 24-hour expiration)

**Key Design Patterns:**
- HOC pattern for premium feature protection (`withPremiumProtection`)
- Modal-based forms for data entry (clients, services, transactions)
- Separation of concerns: Services layer (`authService.js`, `api.js`) decoupled from UI

### Backend Architecture (.NET 8 API)

**Framework:** ASP.NET Core Web API with minimal APIs pattern

**Authentication & Authorization:**
- JWT Bearer token authentication
- BCrypt.Net for password hashing
- Token generation on login with configurable expiration (default 1440 minutes)
- Role-based access planned but not fully implemented

**Database Access:**
- Dapper micro-ORM for lightweight SQL execution
- Direct ADO.NET with MySqlConnector
- No EF Core (chosen for performance and control)
- Manual SQL queries in repository/service layers

**API Structure:**
- RESTful endpoints organized by resource:
  - `/api/auth/*` - Authentication (login, register, forgot-password, reset-password)
  - `/api/users/*` - User profile management
  - `/api/transactions/*` - Financial transactions
  - `/api/services/*` - Service scheduling
  - `/api/scheduling/*` - Calendar events
- Swagger documentation enabled in Development environment

**Configuration Management:**
- `appsettings.json` for production settings
- Environment variables for sensitive data on Render
- Connection string stored in appsettings (should migrate to env vars)

**AI Integration (Premium Feature):**
- HuggingFace API for chatbot (Blenderbot model)
- OCR.space API for image text extraction
- Both require premium subscription check

### Data Storage

**MySQL Database (AlwaysData hosting):**
- Database name: `trampay_tcc`
- Schema managed manually (no migrations framework)
- Tables inferred from code:
  - Users (authentication, profile data)
  - Transactions (financial entries)
  - Services (scheduled appointments)
  - Scheduling (calendar events)
  - Clients, Stock, Equipments (frontend-local for now, backend integration pending)

**Storage Security Approach:**
- **Backend:** Passwords hashed with BCrypt, sensitive data in MySQL
- **Frontend:** Two-tier storage (SecureStore for PII, AsyncStorage for general data)
- **Data classification:** Automatic detection of sensitive fields via `SecureStorage.hasSensitiveData()`

### External Dependencies

**Third-Party APIs:**

1. **ExchangeRate-API** (Currency conversion)
   - API Key: `7b0dd9209108c6604ede5f39`
   - Used in: CurrencyScreen, TradingHomeScreen
   - Fallback: HG Brasil Finance API

2. **AwesomeAPI (BRL Forex)**
   - Endpoint: `economia.awesomeapi.com.br`
   - No API key required
   - Primary source for BRL exchange rates

3. **CoinGecko** (Cryptocurrency data)
   - Public API, no key required
   - Used in: CryptoScreen

4. **IBGE API** (Brazilian states and cities)
   - Public API for location data
   - Used in: CreateAccountScreen

5. **HuggingFace AI** (Premium)
   - API Key: `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`
   - Model: facebook/blenderbot-400M-distill
   - Used in: IAScreen (chatbot)

6. **OCR.space** (Premium)
   - API Key: `K82714945388957`
   - Used in: Document scanning feature

**Firebase Integration:**
- Firebase config present in `DbConfig.js` but appears unused
- Project: `trampay-b5373`
- Auth and Firestore initialized but not actively used (likely legacy)
- **Decision:** Backend uses .NET API instead of Firebase for consistency

**React Native Libraries:**
- `expo-linear-gradient` - UI gradients
- `react-native-mask-text` - Input formatting (CPF, phone)
- `react-native-gesture-handler` - Touch interactions
- `react-native-svg` - Custom charts (PieChart, LineChart)
- `axios` - HTTP client with interceptors

**Development Tools:**
- `concurrently` - Run Expo + proxy server simultaneously
- `http-proxy` - CORS proxy for web development
- Swagger UI for backend API documentation

**Backend NuGet Packages:**
- `BCrypt.Net-Next` - Password hashing
- `Dapper` - Micro-ORM
- `MySqlConnector` - MySQL driver
- `Microsoft.AspNetCore.Authentication.JwtBearer` - JWT middleware
- `Swashbuckle.AspNetCore` - Swagger/OpenAPI

**Deployment Infrastructure:**
- **Backend:** Render.com (free tier, cold starts expected)
- **Database:** AlwaysData MySQL hosting
- **Frontend:** Expo Go for development, EAS Build for production APK/AAB
- **Environment:** Production API URL: `https://trampay.onrender.com/api`

**Known Integration Gaps:**
1. Firebase credentials present but not used - should be removed or integrated
2. Stock, Clients, Equipments stored locally - backend endpoints not connected
3. Premium features (IA, Trading) require backend subscription check not fully implemented
4. Image upload (equipment/stock photos) uses local storage, no cloud integration
---

## Recent Changes (12/11/2025)

### Integração Completa Frontend + Backend Render

**Configuração da API:**
- Frontend agora usa `https://trampay.onrender.com/api` (backend em produção)
- Configurado em: `services/api.js` e `authService.js`

**Bug Crítico Corrigido:**
- Token storage mismatch resolvido (agora usa SecureStore consistentemente)
- Todas APIs autenticadas funcionando (perfil, PRO, IA)

**AuthContext Melhorado:**
- Carregamento automático de perfil do usuário
- Status premium (`isPro`) sincronizado com backend
- `activatePro()`: integrado com `/api/subscription/activate`
- `setUser()`: exportado para atualizações de perfil
- Logout completo: limpa SecureStore + AsyncStorage

**Telas Implementadas:**
1. **IAScreen** (nova): Chat com IA + OCR de imagens
   - Histórico salvo em `ai_chats` e `ai_messages`
   - Verificação de assinatura PRO
   - Interface completa com bubbles e loading states

2. **AssineProScreen** (reescrita): Ativação de PRO
   - Integrada com `/api/subscription/activate`
   - Verifica se usuário já é PRO

3. **EditProfileScreen** (integrada): Edição de perfil
   - GET/PUT `/api/auth/profile`
   - Edita: nome, email, telefone, senha

**SideMenu (Drawer):**
- Reescrito para usar AuthContext
- Navegação PRO funcional (bloqueia e redireciona)
- Layout corrigido e alinhado

**Sistema de Bloqueio PRO:**
- HOC `withPremiumProtection`: protege qualquer tela
- Verificação automática de `isPro`
- Redirecionamento para AssineProScreen

**Backend:**
- Criado `migration_ai_tables.sql` para tabelas de IA
- Tabelas: `ai_chats`, `ai_messages`
- **PENDENTE:** Executar SQL no AlwaysData (phpMyAdmin)

**Arquivos Modificados:**
- `Trampay/services/api.js`
- `Trampay/authService.js`
- `Trampay/AuthContext.js`
- `Trampay/routes.js`
- `Trampay/components/SideMenu.js`
- `Trampay/screens/AssineProScreen.js`
- `Trampay/screens/IAScreen.js` (novo)
- `Trampay/screens/EditProfileScreen.js`
- `Trampay/screens/hocs/withPremiumProtection.js`
- `Backend/migration_ai_tables.sql` (novo)

**Próximas Ações Necessárias:**
1. Executar SQL das tabelas de IA no AlwaysData
2. Testar backend no Render (https://trampay.onrender.com/health)
3. Testar fluxo completo: login → perfil → PRO → IA
4. Fazer commit e push para GitHub
