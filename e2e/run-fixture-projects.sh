#!/usr/bin/env bash

# fail if any commands fails
set -e

. ./helpers.sh

TEMP_TEST_DIR=$(mktemp -d)
FIXTURE_PROJECTS_DIR="${TEMP_TEST_DIR}/fixture-projects-run-$(date +%Y-%m-%d-%H-%M-%S)"

mkdir -p "$FIXTURE_PROJECTS_DIR"
cp -r fixture-projects/* "$FIXTURE_PROJECTS_DIR/"
cp helpers.sh "$TEMP_TEST_DIR/helpers.sh"
cp tsconfig.json "$TEMP_TEST_DIR/tsconfig.json"

for dir in "${FIXTURE_PROJECTS_DIR}"/*; do
    if [ -d "$dir" ]; then

      if [ -n "$1" ] && [ "$(basename "$dir")" != "$1" ]; then
        # only execute the tests for the project passed as argument to this script, if any
        continue
      fi

      echo "[e2e] Running test in $(basename "$dir")"  
      cd "$dir"

      echo "[e2e] Installing modules in $dir"
      yarn

      chmod +x ./test.sh
      ./test.sh
      cd -
      
      printf "[e2e] Finished test in $dir\n\n"
      
    fi
done

rm -fr "$TEMP_TEST_DIR"
