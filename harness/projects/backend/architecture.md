# architecture

## Estado atual

Java 21, Spring Boot 4.1.1 e Gradle. O backend é um monólito modular organizado por domínio sob `src/main/java/br/com/finan`: `account`, `category`, `dashboard`, `fixedentry`, `transaction` e `pluggy`; `shared` contém somente mecanismos transversais usados por várias features. Em cada feature, controllers recebem HTTP e delegam aos services; repositories Spring Data JPA acessam PostgreSQL; requests e responses definem o contrato de transporte. `PluggyClient` usa `RestClient` e o endpoint atual fornece connect token; isso não comprova importação bancária completa. Infraestrutura em `../docker-compose.yml` e consumidor em `../frontend`.

O código ainda não implementa Clean Architecture estrita: entidades usam JPA e os services dependem diretamente de interfaces Spring Data. Erros esperados dos services usam `ApplicationException`, sem dependência HTTP; `ApplicationExceptionHandler` faz o mapping para status na borda web. Trate o acoplamento restante como estado existente, não como precedente obrigatório nem como motivo para uma reorganização em massa.

## Direção recomendada

- Preserve a organização por feature. Dentro de uma feature, separe domínio, aplicação, entrada HTTP e infraestrutura somente quando a complexidade justificar; não crie pacotes ou classes vazias.
- Faça as dependências apontarem para as regras de negócio: controllers validam e traduzem HTTP, services/casos de uso coordenam a operação, e entidades ou funções de domínio protegem invariantes. Banco, Spring MVC e SDKs externos não devem definir a linguagem do núcleo.
- Introduza portas e adapters apenas para fronteiras reais, como persistência, relógio ou APIs externas. A abstração pertence ao lado que a consome; Spring configura a implementação concreta.
- Mantenha DTOs HTTP, modelos de domínio e entidades de persistência distintos quando tiverem responsabilidades ou formatos diferentes. Não adicione mapping mecânico quando as representações forem realmente iguais e não houver fronteira a proteger.
- Prefira nomes do domínio, métodos pequenos e coesos, validação no limite de entrada e erros com significado estável. Use injeção por construtor, `BigDecimal` para dinheiro e transações nos casos de uso que alteram estado relacionado.
- Evolua por fatia vertical quando uma feature for alterada. Evite migração arquitetural ampla, interfaces para toda classe, repositories genéricos, services pass-through, CQRS ou eventos de domínio sem necessidade comprovada.

Fluxo desejado quando a separação trouxer valor: `controller/adaptador de entrada -> caso de uso/aplicação -> domínio`, com a aplicação dependendo de uma porta e a infraestrutura implementando essa porta. Teste regras de domínio sem Spring, coordenação com fakes das portas e adapters nos limites de integração correspondentes.
