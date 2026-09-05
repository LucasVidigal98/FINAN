#!/bin/sh
set -eu

# O processo continuo recompila as classes; o DevTools reinicia a aplicacao.
./gradlew classes --no-daemon
./gradlew classes --continuous --no-daemon &

exec ./gradlew bootRun --no-daemon
