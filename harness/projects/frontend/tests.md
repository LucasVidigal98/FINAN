# tests

Vitest pelo builder @angular/build:unit-test, com arquivos *.spec.ts junto ao código. Nesta pasta com dependências: npm test -- --watch=false e npm run build. Da raiz FINAN com container ativo: docker compose exec frontend npm test -- --watch=false e docker compose exec frontend npm run build. Formatação nesta pasta: npx prettier --check "src/**/*.{ts,html,scss}". Cubra estados renderizados, chamadas e erros afetados. Meta de cobertura não definida.

Teste componentes pelo comportamento visível, interação, acessibilidade e estados de carregamento, sucesso, vazio e erro que a mudança afetar. Teste serviços HTTP nos contratos e mappings; teste funções puras diretamente. Evite testar detalhes internos, duplicar a mesma regra em várias camadas ou criar mocks para código sem fronteira externa.
