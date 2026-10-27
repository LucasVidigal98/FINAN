# api docs

Frontend consome a API e não exige Swagger próprio. Referências: serviços/modelos por feature, controllers/DTOs em ../backend e documentação em ../docs. O README da raiz ainda descreve etapas iniciais; conferir o código para o estado atual.

Open Finance solicita `POST http://localhost:8080/api/open-finance/connect-token` com corpo nulo. A resposta `{ connectToken: string }` é validada antes da abertura do SDK; cada tentativa solicita um token novo, sem cache ou retry automático. Implementação e homologação registradas em `../docs/features/pluggy-connect-widget/`.
