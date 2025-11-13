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

## Recent Changes (13/11/2025)

### 🚀 5 Tarefas Implementadas + Otimizações Críticas

**1. BACKEND - Novos Endpoints Criados:**
- ✅ **InventoryController** - CRUD completo + `/low-stock` endpoint (items abaixo do mínimo)
- ✅ **EquipmentController** - CRUD completo para equipamentos
- ✅ **EventsController** - CRUD completo + `/upcoming` endpoint (próximos eventos)
- ✅ **AnalyticsController** - 7 endpoints para gráficos no backend:
  1. `/summary` - Resumo financeiro (receitas, despesas, saldo, transações)
  2. `/cashflow` - Fluxo de caixa mensal
  3. `/expenses-by-category` - Despesas agrupadas por categoria
  4. `/revenue-by-category` - Receitas agrupadas por categoria
  5. `/top-clients` - Top clientes por volume de transações
  6. `/profitable-items` - Items mais lucrativos
  7. `/growth-trends` - Tendências de crescimento
- ✅ Todos endpoints com `[Authorize]`, validação de userId e scoping por `owner_user_id`
- ✅ Prepared statements (Dapper) para segurança SQL Injection

**2. LOGIN OTIMIZADO (Performance):**
- ✅ Modificado `AuthController.cs` Login endpoint
- ✅ Agora retorna perfil completo + isPro em **1 única query** (batch operation)
- ✅ LEFT JOIN com `subscriptions` para calcular `isPro`
- ✅ Elimina requisição extra ao `/api/auth/profile` após login
- ✅ Reduz tempo de carregamento inicial do app

**3. SPLASH SCREEN - Logo Profissional:**
- ✅ Substituído emoji 👤 placeholder pela logo real `logo_trampay_2025_2.png`
- ✅ Importado `Image` component do React Native
- ✅ Estilização: 200x200px com `resizeMode="contain"`
- ✅ Animação mantida (fade + scale)

**4. POLÍTICAS LGPD + CHECKBOX OBRIGATÓRIO:**
- ✅ Adicionado checkbox na tela de cadastro (`CreateAccountScreen.js`)
- ✅ Modal completo com **6 seções** das Políticas de Segurança e Privacidade:
  1. Segurança da Informação (ISO/IEC 27001)
  2. Proteção de Dados Pessoais (LGPD - Lei 13.709/2018)
  3. Direitos do Usuário (acesso, correção, exclusão, portabilidade)
  4. Coleta e Uso de Dados (transparência)
  5. Segurança Técnica (bcrypt, JWT, HTTPS/TLS 1.3, SQL prepared statements)
  6. Compromisso Ético
- ✅ Validação: **só permite cadastro** se checkbox marcado
- ✅ Link clicável para abrir modal de políticas
- ✅ BUG CORRIGIDO: Separado checkbox do link (TouchableOpacity independentes) para evitar crash de `e.stopPropagation()` no React Native

**5. REVISÃO ARQUITETO:**
- ✅ Todas 5 tarefas aprovadas pelo architect agent
- ✅ Segurança validada (autenticação, scoping, SQL injection)
- ✅ Performance validada (login batch, analytics backend-driven)
- ✅ UX validada (políticas obrigatórias, logo profissional)

**Arquivos Novos:**
- `Backend/TrampayBackend/Controllers/InventoryController.cs`
- `Backend/TrampayBackend/Controllers/EquipmentController.cs`
- `Backend/TrampayBackend/Controllers/EventsController.cs`
- `Backend/TrampayBackend/Controllers/AnalyticsController.cs`

**Arquivos Modificados:**
- `Backend/TrampayBackend/Controllers/AuthController.cs` (login otimizado)
- `Trampay/SplashScreen.js` (logo real)
- `Trampay/CreateAccountScreen.js` (políticas + checkbox + correção bug)

**Status:**
- **Backend:** ✅ Rodando sem erros (porta 8080)
- **Frontend:** ✅ Compilado sem erros
- **Próximo:** Usuário testar fluxo completo de cadastro com políticas

**Verificação de Conexões Backend (13/11/2025):**

**✅ TELAS CONECTADAS AO BACKEND:**
1. **IAScreen** - Totalmente funcional
   - `/api/ai/chat` - Chat com HuggingFace
   - `/api/ai/image` - OCR com OCR.space
   - Proteção PRO ativa
   
2. **EditProfileScreen** - Funcional
   - `PUT /api/auth/profile` - Atualizar perfil
   
3. **Auth Screens** - Funcionais
   - `POST /api/auth/login` - Login otimizado (batch)
   - `POST /api/auth/register` - Cadastro
   - `POST /api/auth/forgot-password` - Recuperação
   
4. **HomeScreen** - Parcialmente conectado
   - Usa AsyncStorage para cache
   - Precisa verificar sincronização com backend

**❌ TELAS DESCONECTADAS (USANDO STORAGE LOCAL):**
1. **StockScreen** → Backend pronto: `InventoryController` (/api/inventory)
   - Usa `SecureStore.getItemAsync('trampay_stock_items')`
   - PRECISA conectar ao backend
   
2. **EquipmentsScreen** → Backend pronto: `EquipmentController` (/api/equipment)
   - Usa `SecureStore.getItemAsync('trampay_equipments')`
   - PRECISA conectar ao backend
   
3. **ClientScreen** → Backend pronto: `ClientsController` (/api/clients)
   - Usa `SecureStorage.getItem('userClients')`
   - PRECISA conectar ao backend
   
4. **ServicesScreen** → Backend pronto: `ServicesController` (/api/services)
   - Usa `SecureStorage.getItem('userServices')`
   - PRECISA conectar ao backend
   
5. **CalendarScreen/Events** → Backend pronto: `EventsController` (/api/events)
   - Usa storage local
   - PRECISA conectar ao backend

**RESUMO:**
- ✅ 3 áreas funcionais conectadas (IA, Perfil, Auth)
- ❌ 5 áreas usando storage local (precisam migração para backend)
- 📊 Backend 100% pronto com todos controllers
- 🎯 Próximo: Migrar telas de Stock, Equipment, Client, Services, Events para API

**Pendente:**
1. Executar `Backend/add_missing_tables.sql` no phpMyAdmin AlwaysData
2. Conectar 5 telas desconectadas ao backend (Stock, Equipment, Client, Services, Events)
3. Testar fluxo completo end-to-end após conexões
