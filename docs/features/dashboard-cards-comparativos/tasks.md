# Cards comparativos do Dashboard — Tasks

Status: implementação concluída em 19/09/2026. 59 testes frontend, build e inspeção visual aprovados. Entregas referentes à [Spec](spec.md) e à [Spec Técnica](spec-tecnica.md). Formatação dos arquivos alterados aprovada; pendências preexistentes detalhadas abaixo.

## 1. Consultar o período e exibir quatro valores (CA01, CA05, CA06)

- [x] Integrar `getComparison` ao `DashboardComponent`, reutilizando `DashboardComparison` e os seletores existentes; não consultar o resumo mensal em paralelo.
- [x] Substituir cards antigos por Receitas, Despesas, Saldo e Investimentos com valores `current`; retirar contagem e rótulo Saldo disponível desta região.
- [x] Cancelar a assinatura anterior ao trocar período e ao destruir o componente; ignorar seleção duplicada em andamento e garantir que cancelamento anterior não finalize o carregamento novo.
- [x] Sincronizar seleção com `currentPeriod`, incluindo ano retornado nas opções quando necessário, sem consulta recursiva. Identificar o mês/ano anterior por `previousPeriod`.
- [x] Limpar valores anteriores durante consulta e erro, reutilizar indicador acessível e retry da seleção atual; validar estrutura/períodos/números antes de publicar a resposta.
- [x] Testar quatro valores, troca real de mês/ano, sincronização, virada de ano, carregamento, erro/retry, cancelamento, resposta obsoleta e ausência de requisições duplicadas.

## 2. Apresentar comparação e casos financeiros (CA01–CA04, CA08)

- [x] Formatar atuais e módulo da diferença em BRL/pt-BR com duas casas; preservar saldo negativo. Formatar percentual recebido com até duas casas, sem multiplicar por 100 nem recalcular valores.
- [x] Classificar direção pela diferença e aplicar favorável/alerta com inversão para despesas; associar ícone a texto ou nome acessível, com estabilidade neutra.
- [x] Exibir “Sem base de comparação” para null individual e “Sem alteração em relação ao mês anterior” para estabilidade, mantendo diferença/percentual zero e texto do mês anterior.
- [x] Renderizar quatro cards mesmo com mês zerado; remover a condição antiga de vazio por `transactionCount`.
- [x] Testar aumento, redução, estabilidade, despesas invertidas, percentual null isolado, ambos os meses zerados, atual vazio/anterior preenchido, saldo negativo e base negativa com sinais opostos de diferença/percentual.
- [x] Testar reais e percentuais, sinal monetário sem duplicação e resposta numérica inválida com NaN/Infinity: erro legível, sem vazamento de valores técnicos, sem converter inválidos em zero.

## 3. Ajustar responsividade e validar entrega (CA01–CA08)

- [x] Adaptar SCSS para grade de quatro/duas/uma colunas, preservando DESIGN.md, superfície, bordas, fontes e densidade; manter legibilidade de valores/textos longos e seletores no celular.
- [x] Verificar teclado, foco, labels, status de carregamento, alerta de erro e direção acessível independente das cores.
- [x] Executar `docker compose exec frontend npm test -- --watch=false` e `docker compose exec frontend npm run build`.
- [x] No ambiente frontend, executar `npx prettier --check "src/**/*.{ts,html,scss}"`; registrar pendências preexistentes separadamente e confirmar formatação dos arquivos alterados.
- [x] Executar `git diff --check`; inspecionar desktop, tablet e celular, registrando screenshots para revisão.
- [x] Validar manualmente seleção de mês → quatro cards → troca de ano/janeiro → carregamento → erro/retry, com comparação do mês imediatamente anterior.
- [x] Registrar comandos/resultados reais e atualizar status dos três documentos somente após implementação e validação.

## Limites desta entrega

Preservar a estrutura do contrato e as hipóteses atualizadas da Spec: Saldo com desconto de investimentos, remoção da contagem desta região, ano no texto de comparação, sinal percentual preservado e erro para números inválidos. Sem questões bloqueantes abertas.

Sem gráficos, migrations, novas dependências ou trabalho Pluggy. Próxima tarefa: gráfico de evolução mensal de receitas, despesas e investimentos.


## Resultados da validação — 19/09/2026

Os serviços frontend/backend estavam parados; os comandos usaram `compose run --rm --no-deps` em vez de `compose exec`. A validação desta etapa é restrita ao frontend, sem alteração ou testes backend.

| Comando executado | Resultado |
| --- | --- |
| `docker compose run --rm --no-deps frontend npm test -- --watch=false` | Exit 0; 59 testes em 9 arquivos. |
| `docker compose run --rm --no-deps frontend npm run build` | Exit 0; build de produção aprovado. |
| `docker compose run --rm --no-deps frontend npx prettier --check "src/**/*.{ts,html,scss}"` | Exit 1; 41 arquivos preexistentes fora do padrão, externos aos quatro arquivos alterados. |
| `docker compose run --rm --no-deps frontend npx prettier --check src/app/dashboard/dashboard.component.ts src/app/dashboard/dashboard.component.html src/app/dashboard/dashboard.component.scss src/app/dashboard/dashboard.component.spec.ts` | Exit 0; quatro arquivos formatados. |
| `git diff --check` | Exit 0. |

Inspeção no navegador com o Angular real e API local temporária de dados simulados, sem acesso ao banco pessoal: desktop 1440×900 (quatro colunas), tablet 800×1000 (duas) e celular 390×1000 (uma), sem rolagem horizontal. Conferidos valores longos, saldo negativo, percentual negativo com aumento favorável, estabilidade, ausência de base individual, seleção de mês/ano e janeiro com dezembro do ano anterior. Teclado Tab move o foco entre seletores com indicação visível; falha HTTP 503 mostra alerta/retry; nova tentativa com resposta atrasada mostra carregamento sem cards antigos e recupera os quatro cards.

Testes automatizados cobrem cancelamento/deduplicação/destruição, resposta obsoleta, sincronização de ano fora das opções iniciais, entrada e troca real de seletores, formatação e cores, meses vazios, null individual e rejeição de estruturas inválidas/NaN/Infinity. A API comparativa continua sendo a única consulta desta tela.

Screenshots da validação visual original, com dados simulados anteriores ao ajuste que passou a descontar investimentos do saldo (o layout permanece igual):

- [Desktop — quatro colunas](screenshots/desktop.png)
- [Tablet — duas colunas](screenshots/tablet.png)
- [Celular — uma coluna, valores longos e saldo negativo](screenshots/celular-valores-longos.png)

Nenhuma dependência, migration ou alteração de backend foi necessária. Sem bloqueios restantes; a ressalva é a formatação preexistente global.
