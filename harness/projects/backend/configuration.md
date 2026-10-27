# configuration

src/main/resources/application.yml recebe SPRING_DATASOURCE_URL, SPRING_DATASOURCE_USERNAME e SPRING_DATASOURCE_PASSWORD. Spring não carrega ../.env automaticamente. ../docker-compose.yml traduz DATABASE_URL, POSTGRES_USER e POSTGRES_PASSWORD; a senha é obrigatória. BACKEND_PORT e POSTGRES_PORT controlam portas publicadas; entre containers o banco usa postgres:5432. PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET vêm do ambiente. Consultar ../.env.example sem registrar valores. Dockerfile.dev e docker/dev-entrypoint.sh apoiam recompilação e DevTools.
