# Guia Detalhado: Como Rodar o Backend Localmente com .env.local e Conectar o App Expo

## 📋 Objetivo
Este guia explica passo a passo como:
- Configurar o backend C# para usar variáveis de ambiente de um arquivo `.env.local`
- Criar e preencher o arquivo `.env.local` com a chave do Gemini
- Iniciar o backend escutando em todas as interfaces (IP)
- Configurar o app Expo para usar o backend local em vez do Render
- Testar o chat de IA localmente

---

## 📁 Estrutura de Pastas Importante

```
Trampay/
├── Backend/
│   └── TrampayBackend/
│       ├── .env.local          # <-- arquivo que vamos criar/editar
│       ├── Program.cs          # <-- já foi ajustado para carregar .env
│       ├── Services/
│       │   └── AiService.cs    # <-- já foi ajustado para ler api__key__gemini
│       └── (outros arquivos...)
└── Trampay/
    ├── screens/
    │   └── IAScreen.js          # <-- já ajustado para layout
    ├── services/
    │   └── api.js               # <-- já ajustado para logar BASE URL
    └── (outros arquivos...)
```

---

## 🔧 Passo 1: Criar/Editar o Arquivo `.env.local` no Backend

1. **Abra o terminal** na pasta `Backend/TrampayBackend`:
   ```powershell
   cd C:\Users\joaco\Documents\Trampay\Backend\TrampayBackend
   ```

2. **Crie o arquivo** (se ainda não existir):
   ```powershell
   # Este comando cria um arquivo .env.local vazio
   New-Item -Path . -Name ".env.local" -ItemType File -Force
   ```

3. **Edite o arquivo** com seu editor preferido (VS Code, Bloco de Notas, etc.) e adicione:
   ```env
   # Variáveis de ambiente locais para o backend TrampayBackend
   # Este arquivo NÃO deve ser versionado (adicione ao .gitignore se ainda não estiver).

   # Chave da API do Gemini para uso local
   api__key__gemini=COLOQUE_SUA_CHAVE_AQUI
   ```

4. **Substitua `COLOQUE_SUA_CHAVE_AQUI`** pela sua chave real do Google Gemini AI.

   - **Onde conseguir a chave?**
     - Acesse: https://makersuite.google.com/app/apikey
     - Clique em “Create API key”
     - Copie a chave (ex: `AIzaSyDdg2w304h_0HMxJNomTaox0NfO9FPYZ0g`)
     - Cole no lugar de `COLOQUE_SUA_CHAVE_AQUI`

5. **Salve o arquivo**.

---

## 🚀 Passo 2: Iniciar o Backend Localmente

1. **No mesmo terminal** (ainda em `Backend/TrampayBackend`), execute:
   ```powershell
   dotnet run --urls "http://0.0.0.0:8080"
   ```

2. **O que esse comando faz?**
   - `dotnet run`: compila e executa o backend
   - `--urls "http://0.0.0.0:8080"`: faz o backend escutar em **todas as interfaces de rede** (localhost, seu IP local, etc.) na porta 8080

3. **Saída esperada** (exemplo):
   ```
   [INIT] Conectando ao banco: Server=mysql-trampay.alwaysdata.net...
   [INIT] Gemini API Key - Config: NOT SET, Env: SET (len=39)
   info: Microsoft.Hosting.Lifetime[14]
         Now listening on: http://0.0.0.0:8080
   info: Microsoft.Hosting.Lifetime[0]
         Application started. Press Ctrl+C to shut down.
   ```

   - **Importante**: A linha `Env: SET (len=39)` confirma que a chave foi lida do `.env.local`

4. **Deixe esse terminal aberto**. O backend precisa continuar rodando enquanto você usa o app.

---

## 📱 Passo 3: Descobrir o Seu IP Local

1. **No Windows**, abra um novo terminal e execute:
   ```powershell
   ipconfig
   ```

2. **Procure pelo adaptador ativo** (Wi-Fi ou Ethernet) e anote o **Endereço IPv4**. Exemplos:
   - `192.168.0.12`
   - `10.0.0.168`
   - `192.168.1.105`

3. **Anote esse IP**. Ele será usado na URL do app.

---

## 🌐 Passo 4: Configurar o App Expo para Usar o Backend Local

1. **Abra um NOVO terminal** (não o mesmo do backend) e navegue até a pasta do app:
   ```powershell
   cd C:\Users\joaco\Documents\Trampay\Trampay
   ```

2. **Defina a variável de ambiente** que aponta para seu backend local:
   ```powershell
   $Env:EXPO_PUBLIC_API_URL = "http://SEU_IP_AQUI:8080/api"
   ```

   - **Substitua `SEU_IP_AQUI`** pelo IP que você anotou no passo anterior.
   - Exemplo real: `$Env:EXPO_PUBLIC_API_URL = "http://10.0.0.168:8080/api"`

3. **Inicie o Expo com tunnel** (para que o celular acesse seu PC via internet):
   ```powershell
   npx expo start --tunnel
   ```

4. **O que é `--tunnel`?**
   - Cria um túnel via internet para que dispositivos fora da sua rede local (celular com dados móveis) consigam acessar seu backend local.
   - Se você estiver usando o celular na mesma Wi-Fi, pode usar apenas `npx expo start`.

---

## 🧪 Passo 5: Verificar se o App Está Usando o Backend Local

1. **No console do Expo**, procure pela linha que adicionamos:
   ```
   [API] BASE URL = http://SEU_IP_AQUI:8080/api
   ```

   - Se aparecer `https://trampay.onrender.com/api`, ainda está indo para o Render. Pare o Expo e repita o Passo 4.

2. **Teste o login**: Faça login no app para confirmar que a comunicação com o backend local está funcionando.

---

## 🤖 Passo 6: Testar o Chat de IA

1. **Acesse a tela de IA** no app.
2. **Envie uma mensagem**.
3. **Observe o terminal do backend** (aquele com `dotnet run`). Você deve ver:
   ```
   [AiService.GetChatResponseAsync] Checking Gemini key: Config=False, Env_api__key=True, Env_Ai__Key=False, Final=True
   [AiService.GetChatResponseAsync] ✅ Gemini key found (length=39)
   [AiService.Gemini] Response: Status=200, ContentType=application/json
   ```

4. **Se vir `[Resposta automática]`**, algo ainda está errado:
   - Verifique se a chave no `.env.local` está correta
   - Verifique se o IP no `EXPO_PUBLIC_API_URL` está correto
   - Verifique se o backend está rodando com `--urls "http://0.0.0.0:8080"`

---

## 🔍 Dicas e Solução de Problemas

### ❌ “Erro de login: timeout exceeded”
- **Causa**: App não consegue alcançar o backend local
- **Solução**:
  - Confirme se `EXPO_PUBLIC_API_URL` está definida **antes** do `npx expo start`
  - Confirme se o IP está correto
  - Confirme se o backend está rodando e escutando em `0.0.0.0:8080`
  - Tente usar `npx expo start` (sem tunnel) se estiver na mesma Wi-Fi

### ❌ “Resposta automática” no chat
- **Causa**: Backend não encontrou a chave do Gemini
- **Solução**:
  - Verifique o log do backend na inicialização: `Env: SET (len=XX)`
  - Verifique se o `.env.local` está na pasta correta (`Backend/TrampayBackend`)
  - Verifique se a variável está exatamente `api__key__gemini=` (minúscula, sem espaços)

### ❌ “Status=404” no log do Gemini
- **Causa**: Modelo incorreto na URL
- **Solução**:
  - Já corrigimos para `gemini-2.5-flash`, mas se aparecer outro erro, verifique se a chave é válida

### ❌ “Não consigo acessar http://SEU_IP:8080/health no navegador”
- **Isso é normal**: `/health` funciona, mas `/api` sozinho não existe
- **Teste**: `http://localhost:8080/health` ou `http://SEU_IP:8080/health`

---

## 📦 Resumo dos Comandos (Copiar e Colar)

```powershell
# 1. Backend (terminal 1)
cd C:\Users\joaco\Documents\Trampay\Backend\TrampayBackend
dotnet run --urls "http://0.0.0.0:8080"

# 2. App (terminal 2)
cd C:\Users\joaco\Documents\Trampay\Trampay
$Env:EXPO_PUBLIC_API_URL = "http://SEU_IP_AQUI:8080/api"
npx expo start --tunnel
```

---

## 🚨 Importante

- **Nunca commit o arquivo `.env.local`** com chaves reais. Adicione ao `.gitignore` se ainda não estiver.
- **Sempare os terminais**: Use um terminal para o backend e outro para o app.
- **Mantenha o backend rodando** enquanto testa o app.
- **Use tunnel (`--tunnel`)** apenas se necessário; se estiver na mesma rede, `npx expo start` é mais rápido.

---

## 🎉 Pronto!

Após seguir esses passos:
- ✅ Backend rodando localmente e lendo a chave do Gemini do `.env.local`
- ✅ App Expo apontando para seu backend local via IP
- ✅ Chat de IA funcionando com respostas reais do Gemini

Se ainda tiver problemas, copie os logs exatos do backend e do Expo para ajustarmos.
