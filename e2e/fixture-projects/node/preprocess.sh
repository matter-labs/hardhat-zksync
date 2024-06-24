#!/usr/bin/env bash

# Set script to exit on error
set -e

echo "Current directory before any operations: $(pwd)"

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)

# Create the package.json file dynamically so pnpm does not pick it up when installing dependencies.
cat <<EOF > "$SCRIPT_DIR/package.json"
{
  "name": "@matterlabs/hardhat-zksync-node",
  "version": "1.0.3",
  "description": "Hardhat plugin to run zkSync era-test-node locally",
  "repository": "github:matter-labs/hardhat-zksync",
  "homepage": "https://github.com/matter-labs/hardhat-zksync/tree/main/packages/hardhat-zksync-node",
  "author": "Matter Labs",
  "license": "MIT",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "keywords": [
    "ethereum",
    "smart-contracts",
    "hardhat",
    "hardhat-plugin",
    "zkSync"
  ],
  "scripts": {
    "lint": "pnpm eslint",
    "prettier:check": "pnpm prettier --check",
    "lint:fix": "pnpm eslint --fix",
    "fmt": "pnpm prettier --write",
    "eslint": "eslint 'src/**/*.ts' 'test/**/*.ts'",
    "prettier": "prettier 'src/**/*.ts' 'test/**/*.ts'",
    "test": "c8 mocha test/tests.ts --exit",
    "build": "tsc --build .",
    "clean": "rimraf dist"
  },
  "files": [
    "dist/",
    "src/",
    "LICENSE",
    "README.md"
  ],
  "dependencies": {
    "@matterlabs/hardhat-zksync-solc": "^1.1.4",
    "axios": "^1.7.2",
    "chalk": "^4.1.2",
    "fs-extra": "^11.2.0",
    "proxyquire": "^2.1.3",
    "chai": "^4.3.4",
    "undici": "^6.18.2",
    "sinon-chai": "^3.7.0",
    "sinon": "^18.0.0"
  },
  "devDependencies": {
    "@types/chai": "^4.3.16",
    "@types/fs-extra": "^11.0.4",
    "@types/mocha": "^10.0.6",
    "@types/node": "^18.11.17",
    "@types/proxyquire": "^1.3.31",
    "@types/sinon-chai": "^3.2.10",
    "@typescript-eslint/eslint-plugin": "^7.12.0",
    "@typescript-eslint/parser": "^7.12.0",
    "eslint": "^8.56.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-import": "^2.29.1",
    "eslint-plugin-no-only-tests": "^3.1.0",
    "eslint-plugin-prettier": "^5.0.1",
    "hardhat": "^2.22.5",
    "mocha": "^10.4.0",
    "prettier": "^3.3.0",
    "rimraf": "^5.0.7",
    "ts-node": "^10.9.2",
    "typescript": "^5.3.0",
    "zksync-ethers": "^6.8.0",
    "c8": "^9.1.0"
  },
  "peerDependencies": {
    "hardhat": "^2.22.5",
    "zksync-ethers": "^6.8.0"
  },
  "prettier": {
    "tabWidth": 4,
    "printWidth": 120,
    "parser": "typescript",
    "singleQuote": true,
    "bracketSpacing": true
  }
}
EOF

echo "Pre-processing complete."
