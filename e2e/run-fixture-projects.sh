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


# Post-processing step
exclude_dirs=("mixed" "compatability-check")

for dir in "${BASE_FIXTURE_PROJECTS_DIR}"/*; do
    if [ -d "$dir" ]; then
        if [ -n "$1" ] && [[ ! " ${exclude_dirs[@]} " =~ " $(basename "$dir") " ]]; then
            continue
        fi

        package_json="${dir}/package.json"
        if [ -f "$package_json" ]; then
            if [[ ! " ${exclude_dirs[@]} " =~ " $(basename "$dir") " ]]; then
                rm "$package_json"
                echo "[e2e] Deleted package.json in $(basename "$dir")"
            else
                echo "[e2e] Skipped deleting package.json in $(basename "$dir")"
            fi
        fi
    fi
done
