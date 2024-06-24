#!/usr/bin/env bash

# Set script to exit on error
set -e

echo "Current directory before any operations: $(pwd)"

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)

# Create the package.json file dynamically so pnpm does not pick it up when installing dependencies.
cat <<EOF > "$SCRIPT_DIR/package.json"
{
  "name": "@matterlabs/hardhat-zksync-deploy",
  "version": "1.4.0",
  "description": "Hardhat plugin to deploy smart contracts into the zkSync network",
  "repository": "github:matter-labs/hardhat-zksync",
  "homepage": "https://github.com/matter-labs/hardhat-zksync/tree/main/packages/hardhat-zksync-deploy",
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
    "test": "c8 mocha --recursive \"test/tests/**/*.ts\" --no-timeout --exit",
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
    "chalk": "^4.1.2",
    "ts-morph": "^22.0.0",
    "chai": "^4.3.4",
    "glob": "^10.4.1",
    "fs-extra": "^11.2.0",
    "lodash": "^4.17.21",
    "sinon-chai": "^3.7.0",
    "sinon": "^18.0.0"
  },
  "devDependencies": {
    "@types/chai": "^4.3.16",
    "@types/mocha": "^10.0.6",
    "@types/node": "^18.11.17",
    "@types/glob": "^8.1.0",
    "@types/lodash": "^4.14.202",
    "@typescript-eslint/eslint-plugin": "^7.12.0",
    "@typescript-eslint/parser": "^7.12.0",
    "eslint": "^8.56.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-import": "^2.29.1",
    "eslint-plugin-no-only-tests": "^3.1.0",
    "eslint-plugin-prettier": "^5.0.1",
    "ethers": "^6.12.2",
    "zksync-ethers": "^6.8.0",
    "hardhat": "^2.22.5",
    "ts-node": "^10.9.2",
    "prettier": "^3.3.0",
    "rimraf": "^5.0.7",
    "typescript": "^5.3.0",
    "c8": "^9.1.0"
  },
  "peerDependencies": {
    "hardhat": "^2.22.5",
    "ethers": "^6.12.2",
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