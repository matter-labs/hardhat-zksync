import { NomicLabsHardhatPluginError } from "hardhat/plugins";
import { ResolvedFile } from "hardhat/internal/solidity/resolver";

export function add0xPrefixIfNecessary(hex: string): string {
  hex = hex.toLowerCase();

  if (hex.slice(0, 2) === "0x") {
    return hex;
  }

  return `0x${hex}`;
}

// Returns a built plugin exception object.
export function pluginError(
  message: string,
  parent?: any
): NomicLabsHardhatPluginError {
  return new NomicLabsHardhatPluginError(
    "@matterlabs/hardhat-zksync-solc",
    message,
    parent
  );
}

export function getFileWithoutImports(fileContent: string) {
  const IMPORT_SOLIDITY_REGEX = /^\s*import(\s+)[\s\S]*?;\s*$/gm;

  return fileContent.replace(IMPORT_SOLIDITY_REGEX, "").trim();
}

export function getLicense(resolvedFile: ResolvedFile) {
  const LicenseRegex =
    /\s*\/\/(\s*)SPDX-License-Identifier:(\s+)([a-zA-Z0-9._-]+)/gm;
  const match = resolvedFile.content.rawContent.match(LicenseRegex);
  return match ? match[0] : "";
}

export function combineLicenses(licenses: Map<string, string>) {
  const licenseNames: string[] = [];
  for (const value of licenses.values()) {
    licenseNames.push(value.split(":")[1].trim());
  }
  const uniqueLicenseNames = [...new Set(licenseNames)];
  if (uniqueLicenseNames.length === 1) {
    return `// SPDX-License-Identifier: ${uniqueLicenseNames[0]}`;
  } else {
    return `// SPDX-License-Identifier: ${uniqueLicenseNames.join(" AND ")}`;
  }
}

export function combinePragmas(
  pragmas: Map<string, string>,
  warnings: string[]
) {
  const uniquePragmas = [...new Set(Array.from(pragmas.values()))];

  for (const value of pragmas.values()) {
    const name = value.split(" ")[1];
    const version = value.split(" ")[2];
    if (
      ["abicoder", "experimental"].includes(name) &&
      version.toLowerCase().includes("v2")
    ) {
      if (uniquePragmas.length > 1) {
        warnings.push(`INCOMPATIBLE PRAGMA DIRECTIVES: ${value} was used`);
      }
      return value;
    }
  }

  // just return a pragma if no abiencoder was found
  const out = Array.from(pragmas.values())[0];
  if (uniquePragmas.length > 1) {
    warnings.push(`INCOMPATIBLE PRAGMA DIRECTIVES: ${out} was used`);
  }
  return out;
}

export function getPragmaAbiEncoder(resolvedFile: ResolvedFile) {
  const PragmaRegex = /pragma abicoder [0-9a-zA-z]+;\n/gm;
  const match = resolvedFile.content.rawContent.match(PragmaRegex);
  return match ? match[0] : "";
}

export function getPragmaSolidityVersion(resolvedFile: ResolvedFile) {
  const PragmaRegex = /pragma solidity [\^><=0-9.]+(\s)?[\^><=0-9.]*;\n/gm;
  const match = resolvedFile.content.rawContent.match(PragmaRegex);
  return match ? match[0] : "";
}
