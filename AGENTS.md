# Repository Guidelines

## Project Structure & Module Organization

`frontend/` contains the Angular 22 application. Feature code lives under `frontend/src/app/`; transaction models, services, components, templates, and styles stay together in `app/transactions/`. Static files belong in `frontend/public/`.

`backend/` is a Java 21 Spring Boot API. Production code is under `backend/src/main/java/br/com/finan/`, with domain packages such as `transaction/`. Tests mirror that layout in `backend/src/test/java/`. Flyway migrations live in `backend/src/main/resources/db/migration/`; never edit an applied migration. Add the next `V<number>__description.sql` file.

## Build, Test, and Development Commands

Copy `.env.example` to `.env` and set `POSTGRES_PASSWORD`, then use Docker Compose:

- `docker compose up -d --build` builds and starts Angular, Spring Boot, and PostgreSQL.
- `docker compose logs -f backend` follows backend startup and reload output.
- `docker compose exec frontend npm run build` creates a production frontend build.
- `docker compose exec frontend npm test -- --watch=false` runs Angular unit tests once.
- `docker compose run --rm backend ./gradlew test` runs backend tests against PostgreSQL.

The UI is available at `http://localhost:4200/transactions`; the API is at `http://localhost:8080/api/transactions`.

## Coding Style & Naming Conventions

Use four spaces in Java and two spaces in TypeScript, HTML, SCSS, JSON, and YAML. Follow existing TypeScript formatting: single quotes and trailing commas. Prettier is installed in `frontend/`; check changes with `npx prettier --check "src/**/*.{ts,html,scss}"` from that directory.

Java classes use `PascalCase`, methods and fields use `camelCase`, and packages remain lowercase. Angular files use kebab-case suffixes such as `transaction.service.ts` and `transaction-list.component.ts`. Keep validation in the backend and use `BigDecimal` for money.

## Testing Guidelines

Backend tests use JUnit 5, AssertJ, Spring Boot Test, and MockMvc; name classes `*Tests.java`. Frontend tests use Vitest through Angular's test builder and use `*.spec.ts`. Add focused tests for changed behavior, especially validation, persistence, API responses, and rendered states. Backend integration tests require a separate, empty PostgreSQL test database.

## Commit & Pull Request Guidelines

History follows Conventional Commit-style subjects: `feat: ...`, `feat(backend): ...`, `fix: ...`, and `chore: ...`. Keep subjects imperative and scoped when useful. Pull requests should explain the behavior change, list validation commands, link the relevant issue, and include screenshots for visible UI changes. Call out new environment variables or migrations explicitly.

## Security & Configuration

Never commit `.env` or database credentials. Keep `.env.example` limited to placeholders. Preserve Hibernate's `ddl-auto: validate`; evolve the schema through Flyway migrations.
