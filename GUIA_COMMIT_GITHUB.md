# 📤 Guia: Como Subir as Mudanças para o GitHub

## 🎯 Resumo
Você tem **10 arquivos modificados/criados** prontos para commit. Este guia te ajuda a subir tudo para o repositório `https://github.com/talesjardim08/Trampay`.

---

## 📝 Passo a Passo

### 1. Abra o Terminal/Shell do Replit
No menu lateral esquerdo, clique em "Shell" ou "Console".

### 2. Verifique os arquivos modificados
```bash
git status
```

Você deverá ver aproximadamente estes arquivos:
- ✅ `Trampay/services/api.js`
- ✅ `Trampay/authService.js`
- ✅ `Trampay/AuthContext.js`
- ✅ `Trampay/routes.js`
- ✅ `Trampay/components/SideMenu.js`
- ✅ `Trampay/screens/AssineProScreen.js`
- ✅ `Trampay/screens/IAScreen.js`
- ✅ `Trampay/screens/EditProfileScreen.js`
- ✅ `Trampay/screens/hocs/withPremiumProtection.js`
- ✅ `Backend/migration_ai_tables.sql`
- ✅ `CHANGELOG_INTEGRACAO.md` (novo)
- ✅ `GUIA_COMMIT_GITHUB.md` (novo)

### 3. Adicione todos os arquivos ao staging
```bash
git add .
```

**OU** adicione arquivos específicos:
```bash
git add Trampay/services/api.js
git add Trampay/authService.js
git add Trampay/AuthContext.js
git add Trampay/routes.js
git add Trampay/components/SideMenu.js
git add Trampay/screens/AssineProScreen.js
git add Trampay/screens/IAScreen.js
git add Trampay/screens/EditProfileScreen.js
git add Trampay/screens/hocs/withPremiumProtection.js
git add Backend/migration_ai_tables.sql
git add CHANGELOG_INTEGRACAO.md
git add GUIA_COMMIT_GITHUB.md
```

### 4. Faça o commit com mensagem descritiva
```bash
git commit -m "feat: Integração completa frontend + backend Render

- Configurado frontend para usar API de produção (Render)
- Corrigido bug crítico de token storage (SecureStore)
- AuthContext completo com activatePro e logout
- Telas implementadas: IAScreen (chat+OCR), AssinePro, EditProfile
- SideMenu corrigido e integrado com AuthContext
- Sistema de bloqueio PRO funcional (HOC withPremiumProtection)
- Backend: adicionado SQL para tabelas ai_chats e ai_messages

Closes #[número do issue se houver]"
```

### 5. Envie para o GitHub
```bash
git push origin main
```

**OU** se sua branch principal for `master`:
```bash
git push origin master
```

### 6. Se houver conflitos ou erro de "upstream"
```bash
# Primeiro, puxe as mudanças remotas
git pull origin main --rebase

# Depois faça push novamente
git push origin main
```

---

## 🔍 Comandos Úteis

### Ver o que foi modificado em cada arquivo
```bash
git diff Trampay/services/api.js
```

### Ver lista resumida de mudanças
```bash
git status --short
```

### Ver histórico de commits
```bash
git log --oneline -10
```

### Desfazer staging (antes do commit)
```bash
git reset HEAD arquivo.js
```

### Desfazer commit (mantém mudanças)
```bash
git reset --soft HEAD~1
```

---

## ⚠️ Troubleshooting

### Problema: "fatal: refusing to merge unrelated histories"
```bash
git pull origin main --allow-unrelated-histories
git push origin main
```

### Problema: "Permission denied (publickey)"
Configure sua chave SSH no GitHub ou use HTTPS:
```bash
git remote set-url origin https://github.com/talesjardim08/Trampay.git
git push origin main
```

### Problema: "Your branch is behind"
```bash
git pull origin main --rebase
git push origin main
```

---

## ✅ Verificação Final

Após o push, verifique:
1. Acesse https://github.com/talesjardim08/Trampay
2. Confira se os arquivos foram atualizados
3. Verifique o commit no histórico
4. Leia o `CHANGELOG_INTEGRACAO.md` no GitHub

---

## 📋 Checklist Pós-Commit

- [ ] Commit foi enviado com sucesso
- [ ] Todos arquivos estão no GitHub
- [ ] CHANGELOG está visível
- [ ] Executar SQL das tabelas de IA no AlwaysData
- [ ] Testar backend no Render (https://trampay.onrender.com/health)
- [ ] Testar app completo (login → perfil → PRO → IA)

---

## 🎉 Pronto!

Suas mudanças estão agora no repositório GitHub. O próximo passo é executar o SQL das tabelas de IA no AlwaysData e testar tudo!
