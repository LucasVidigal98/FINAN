# tests

Vitest pelo builder @angular/build:unit-test, com arquivos *.spec.ts junto ao código. Nesta pasta com dependências: npm test -- --watch=false e npm run build. Da raiz FINAN com container ativo: docker compose exec frontend npm test -- --watch=false e docker compose exec frontend npm run build. Formatação nesta pasta: npx prettier --check "src/**/*.{ts,html,scss}". Cubra estados renderizados, chamadas e erros afetados. Meta de cobertura não definida.
