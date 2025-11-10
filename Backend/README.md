# TrampayBackend (.NET 8) — quickstart

## Dependências
- .NET 8 SDK
- MySQL (AlwaysData) — banco trampay_tcc

## Variáveis de ambiente (local / Render)
- ConnectionStrings__Default => server=...;port=3306;database=trampay_tcc;user=...;password=...;
- Jwt__Key => uma string longa e secreta
- Jwt__Issuer => TrampayApi
- Jwt__Audience => TrampayApp
- Jwt__ExpireMinutes => 1440
- DEV_SHOW_TOKENS => true (opcional, para desenvolvimento - mostra token de reset no response)

## Rodando localmente
1. No terminal:
   cd TrampayBackend
   dotnet restore
   dotnet build
   dotnet run

2. O app vai rodar em http://localhost:5000 (ou porta mostrada no console).
3. Swagger disponível em /swagger quando em ambiente Development.

## Testes básicos (exemplos)
- Registrar:
  POST /api/auth/register
  body JSON: { "AccountType":"pf","DocumentType":"CPF","DocumentNumber":"00000000000","LegalName":"Teste","DisplayName":"Teste","BirthDate":null,"Email":"t@t.com","Phone":"5599999999","AddressStreet":null,"AddressNumber":null,"AddressComplement":null,"AddressNeighborhood":null,"AddressCity":"Cidade","AddressState":"UF","AddressZip":null,"Senha":"123456" }

- Login:
  POST /api/auth/login
  body: { "Email":"t@t.com", "Senha":"123456" }

- Forgot password:
  POST /api/auth/forgot-password
  body: { "Email":"t@t.com" }
  (se DEV_SHOW_TOKENS=true resposta incluirá token)

- Reset password:
  POST /api/auth/reset-password
  body: { "Token":"...", "NewPassword":"nova1234" }

