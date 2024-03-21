#!/usr/bin/env bash

# Set script to exit on error
set -e

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)

# Create the package.json file dynamically so yarn does not pick it up when installing dependencies.
cat <<EOF > "$SCRIPT_DIR/package.json"
{
    "name": "e2e-mixed",
    "version": "0.1.0",
    "author": "Matter Labs",
    "license": "MIT",
    "scripts": {
      "lint": "yarn eslint",
      "prettier:check": "yarn prettier --check",
      "lint:fix": "yarn eslint --fix",
      "fmt": "yarn prettier --write",
      "eslint": "eslint deploy/*.ts",
      "prettier": "prettier deploy/*.ts",
      "test": "mocha test/tests.ts --exit",
      "build": "tsc --build .",
      "clean": "rimraf dist"
    },
    "devDependencies": {
      "@types/node": "^18.11.17",
      "@typescript-eslint/eslint-plugin": "6.13.1",
      "@typescript-eslint/parser": "6.13.1",
      "eslint": "^8.54.0",
      "eslint-config-prettier": "9.0.0",
      "eslint-plugin-import": "2.29.0",
      "eslint-plugin-no-only-tests": "3.1.0",
      "eslint-plugin-prettier": "5.0.1",
      "prettier": "3.1.0",
      "rimraf": "^3.0.2",
      "ts-node": "^10.6.0",
      "typescript": "^5.1.6"
    },
    "dependencies": {
      "@matterlabs/hardhat-zksync-deploy": "1.2.1",
      "@matterlabs/hardhat-zksync-solc": "1.1.4",
      "@matterlabs/hardhat-zksync-node":"1.0.2",
      "@matterlabs/hardhat-zksync-upgradable":"1.3.1",
      "@matterlabs/hardhat-zksync-vyper": "1.0.8",
      "@nomiclabs/hardhat-vyper": "^3.0.5",
      "chalk": "4.1.2",
      "hardhat": "^2.19.4",
      "ethers": "^6.7.1",
      "zksync-ethers": "^6.0.0",
      "@matterlabs/zksync-contracts": "^0.6.1",
      "@openzeppelin/contracts": "^4.9.2",
      "@openzeppelin/contracts-upgradeable": "^4.9.2"
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

