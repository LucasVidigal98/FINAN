# Pluggy Connect Widget no Angular — Spec

Status: frontend implementado e homologado com o sandbox real em 26/10/2026. Evidências e limites em [Tasks](tasks.md).

## Objetivo

Permitir iniciar uma conexão com uma instituição pela interface do FINAN, usando um Connect Token novo obtido do backend. Autenticação e geração do token já foram validadas pelo usuário.

## Comportamento

- Disponibilizar a área Open Finance com a ação “Conectar instituição”.
- Ao clicar, mostrar “Preparando conexão…”, bloquear cliques repetidos e solicitar `POST /api/open-finance/connect-token`. Abrir uma única instância do widget com o token recebido.
- Manter a ação indisponível enquanto houver solicitação ou widget ativo. Cada nova tentativa exige novo token; não há retry automático no frontend.
- Sucesso: mostrar “Conexão realizada com sucesso. A importação de contas e transações estará disponível em uma próxima etapa.”
- Fechamento sem resultado: mostrar “Janela de conexão encerrada. Você pode tentar novamente.” Não afirmar que a operação foi cancelada na instituição.
- Falha de token, abertura ou callback de erro: apresentar “Não foi possível concluir a conexão. Tente novamente.” Nunca reproduzir mensagem ou payload remoto.
- Encerrar a instância e liberar nova tentativa após resultado terminal ou fechamento. Um fechamento posterior ao sucesso/erro não substitui a mensagem anterior.
- Manter token somente em memória durante a tentativa, sem logs, armazenamento persistente, estado global ou exposição na interface do FINAN.
- Ao sair da página, cancelar a solicitação pendente, liberar o widget e ignorar respostas/callbacks antigos.

## Decisões e hipóteses

- **Confirmado pelo usuário:** incluir conectores sandbox nesta etapa para conferência manual.
- **Hipótese de interface:** criar rota `/open-finance` e item “Open Finance” no menu existente, pois ainda não há essa área no frontend. Página mínima, sem listagem de conexões.
- **Decisão técnica proposta:** usar o SDK JavaScript oficial `pluggy-connect-sdk` no Angular, sem wrapper React ou loader próprio de CDN. Confirmar versão e API pública antes de instalar na implementação.
- Usar sandbox somente no desenvolvimento; a compilação de produção deve omiti-lo. Não criar seletor de ambiente na interface.

## Critérios de aceite

- **CA01:** menu e página Open Finance apresentam o botão; um clique solicita um token novo e abre o widget; cliques duplicados não geram requisições/instâncias extras.
- **CA02:** fechamento permite nova tentativa; sucesso e falhas têm mensagens claras; fechamento posterior não sobrescreve resultado terminal.
- **CA03:** token e payloads sensíveis não são persistidos nem registrados; tentativas encerradas e navegação liberam referências e não permitem ações tardias.
- **CA04:** página segue `DESIGN.md`, funciona em desktop/celular, oferece foco visível e feedback acessível; sandbox aparece no desenvolvimento e não em produção.
- **CA05:** testes, build e conferência manual no navegador cobrem abertura, sucesso, fechamento, falha e nova tentativa; resultados reais são registrados sem segredos.

## Fora de escopo e pendências

Sem importação, persistência de Item/contas/transações, webhooks, sincronização, atualização de conexão existente, novas migrations ou mudanças no contrato backend. O callback informa o resultado observado no navegador; não cria um registro durável de conexão no FINAN.

Não há dúvida de produto bloqueante. A versão e o mecanismo público de encerramento do SDK devem ser verificados na implementação. A meta de cerca de 20 minutos é indicativa, sem dispensar a conferência manual.

Detalhes: [Spec Técnica](spec-tecnica.md) e [Tasks](tasks.md).

