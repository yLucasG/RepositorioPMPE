# Repositório Acadêmico — PMPE/DTEC 🏛️🛡️

> **Plataforma institucional para gestão, consulta e preservação da produção acadêmica da Polícia Militar de Pernambuco.**

---

![Angular](https://img.shields.io/badge/Angular%2021-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini%20IA-4285F4?style=for-the-badge&logo=google&logoColor=white)

## 📖 Visão Geral Institucional

Este repositório foi desenvolvido sob a égide da **Diretoria de Tecnologia (DTEC)** para centralizar e modernizar o acervo acadêmico da **Polícia Militar de Pernambuco**. O sistema automatiza a catalogação de monografias, dissertações e artigos, garantindo que o conhecimento estratégico institucional seja preservado e facilmente acessível por pesquisadores.

---

## 🧱 Arquitetura do Sistema

O projeto é dividido em três camadas:

- **Frontend** — aplicação Angular (SPA) responsável pela busca pública e pelo painel administrativo. Código em [`src/`](src/).
- **API** — servidor Express (TypeScript) que expõe as rotas em `/api/*`, responsável pelas regras de negócio, autenticação do admin e integração com a IA. Código em [`api/app.ts`](api/app.ts).
- **Banco de Dados** — PostgreSQL, acessado via **Prisma ORM** ([`prisma/schema.prisma`](prisma/schema.prisma)), com duas tabelas principais: `TrabalhoAcademico` (o acervo) e `Admin` (usuários do painel).

O mesmo servidor Express ([`api/server.ts`](api/server.ts)) serve o build estático do Angular **e** a API num único processo Node contínuo, na porta 3000 — não há função serverless nem build separado por camada.

Os PDFs enviados no cadastro são salvos direto em disco (pasta configurável via `UPLOADS_DIR`), sem depender de nenhum serviço de storage externo.

---

## 🚀 Como o Sistema Funciona

### Módulo Público (Consulta)
- **Busca Avançada**: filtros dinâmicos por linha de pesquisa, autor e ano.
- **Paginação**: carregamento otimizado de resultados na Home.
- **Linhas de Pesquisa Oficiais**: classificação estrita baseada nas 10 diretrizes da PMPE:
  1. Cenários Estratégicos, Cultura e Doutrina PM
  2. Políticas Públicas e Gestão de Segurança Pública
  3. Estratégias de Policiamento e Prevenção à Criminalidade
  4. Violência Social e Criminalidade
  5. Educação Policial, Ensino e Instrução Policial Militar
  6. Polícia, Direitos Humanos e Cidadania
  7. Administração Estratégica
  8. Gestão de Pessoas, Logística e Finanças Públicas
  9. Saúde e Qualidade de Vida do Policial Militar
  10. Inovação e Tecnologias em Segurança Pública

### Módulo Administrativo (Gestão)
- **Login restrito** (`/admin/login`) com usuário e senha armazenados com hash bcrypt na tabela `Admin` — não existe tela pública de cadastro, o primeiro admin é criado direto no servidor.
- **Dashboard de Estatísticas**: monitoramento de visualizações e downloads.
- **Upload em Lote com IA**: ao enviar um PDF, o Gemini lê o documento e preenche automaticamente título, autores, resumo, referências, ano e linha de pesquisa — o usuário só revisa e confirma.
- **Gestão de Acervo**: edição, visualização e exclusão (individual ou em lote) dos trabalhos cadastrados.

---

## 🏢 Instalando no servidor do DTEC

O passo a passo completo de instalação — com e sem Docker, criação do primeiro admin, HTTPS, backup e atualização — está em **[DEPLOY_DTEC.md](DEPLOY_DTEC.md)**.

---

## 💻 Rodando localmente para desenvolvimento

### 1. Instalar dependências
```bash
npm install
```
(o `postinstall` já roda o `prisma generate` automaticamente)

### 2. Configurar variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto:
```env
DATABASE_URL="postgresql://usuario:senha@host:porta/database"
JWT_SECRET="uma-string-aleatoria-longa"
GEMINI_API_KEY="sua-chave-opcional-do-gemini"
```

### 3. Criar as tabelas no banco
```bash
npx prisma db execute --file ./prisma/schema_completo.sql
```

### 4. Subir os dois processos (dois terminais)
**Backend (API + arquivos estáticos):**
```bash
npx tsc -p tsconfig.server.json && node dist-server/server.js
```

**Frontend (com hot reload):**
```bash
npm start
```
O `ng serve` já está configurado ([`proxy.conf.json`](proxy.conf.json)) para encaminhar chamadas `/api/*` para o backend local na porta 3000.
