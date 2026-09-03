# Imagem self-hosted (DTEC/PMPE): builda o Angular + a API e roda tudo num único
# processo Node (api/server.ts), servindo o front, a API e os PDFs enviados.
# Não é usada pela Vercel (lá o build é outro pipeline, gerenciado pela própria Vercel).

# ---- Build ----
FROM node:22-slim AS builder
WORKDIR /app

# Só pra "prisma generate" (roda no postinstall do npm ci) não falhar por falta da
# variável — não conecta em banco nenhum nesta etapa.
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/placeholder"

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build \
 && npx tsc -p tsconfig.server.json

# ---- Runtime ----
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV UPLOADS_DIR=/app/uploads
ENV ANGULAR_DIST=/app/dist/repositorio-angular/browser
ENV PORT=3000

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY package.json ./

RUN mkdir -p /app/uploads

EXPOSE 3000
CMD ["node", "dist-server/server.js"]
