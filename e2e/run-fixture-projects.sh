#!/usr/bin/env bash

# fail if any commands fails
set -e

# import helpers functions
. ./helpers.sh

# Create the first temporary directory
TEMP_TEST_DIR=$(mktemp -d)
# Now within this directory, create your fixture projects directory with the current date and time
FIXTURE_PROJECTS_DIR="${TEMP_TEST_DIR}/fixture-projects-run-$(date +%Y-%m-%d-%H-%M-%S)"

# Create the fixture projects directory
mkdir -p "$FIXTURE_PROJECTS_DIR"
# Copy the contents of the fixture-projects directory into the newly created fixture projects directory
cp -r fixture-projects/* "$FIXTURE_PROJECTS_DIR/"
# Copy the helpers.sh and tsconfig.json to the temp test directory
cp helpers.sh "$TEMP_TEST_DIR/helpers.sh"
cp tsconfig.json "$TEMP_TEST_DIR/tsconfig.json"

# Now proceed with your tests as before
for dir in "${FIXTURE_PROJECTS_DIR}"/*; do
    if [ -d "$dir" ]; then

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

# Clean up: remove the first temporary directory which will also remove its subdirectories
rm -fr "$TEMP_TEST_DIR"
