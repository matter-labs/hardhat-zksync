#!/usr/bin/env bash

# fail if any commands fails
set -e

. ./helpers.sh

BASE_FIXTURE_PROJECTS_DIR="fixture-projects"


# Pre-processing check
for dir in "${BASE_FIXTURE_PROJECTS_DIR}"/*; do
    if [ -d "$dir" ]; then

        if [ -n "$1" ] && [ "$(basename "$dir")" != "$1" ]; then
            # only execute the tests for the project passed as argument to this script, if any
            continue
        fi

        preprocess_script="${dir}/preprocess.sh"
        
        # Check if the preprocess script exists
        if [ ! -f "$preprocess_script" ]; then
            echo "Error: Preprocess script not found in $dir"
            exit 1
        else
            echo "[e2e] Running preprocessing in $(basename "$dir")"
            chmod +x "$preprocess_script"
            "$preprocess_script"
        fi
    fi
done

TEMP_TEST_DIR=$(mktemp -d)
FIXTURE_PROJECTS_DIR="${TEMP_TEST_DIR}/fixture-projects-run-$(date +%Y-%m-%d-%H-%M-%S)"

mkdir -p "$FIXTURE_PROJECTS_DIR"
rsync -av --exclude=package.json fixture-projects/ "$FIXTURE_PROJECTS_DIR/"

# Move package.json files separately
for dir in fixture-projects/*; do
    if [ -d "$dir" ] && [ -f "$dir/package.json" ]; then
        # Construct the destination directory path
        dest_dir="$FIXTURE_PROJECTS_DIR/$(basename "$dir")"
        # Move package.json to the destination directory
        mv "$dir/package.json" "$dest_dir/"
    fi
done

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
      yarn || { echo "yarn install failed, initializing npm"; npm init ; }

      chmod +x ./test.sh
      ./test.sh

      cd -
      
      printf "[e2e] Finished test in $dir\n\n"
      
    fi
done

rm -fr "$TEMP_TEST_DIR"