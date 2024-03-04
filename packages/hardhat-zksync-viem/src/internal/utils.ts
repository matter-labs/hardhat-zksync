import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Address ,toFunctionSelector} from "viem";
import { ZkSyncArtifact } from "./types";
import { addressBytesLength, contractDeployerAddress } from "./constants";

const ZKSOLC_ARTIFACT_FORMAT_VERSION = "hh-zksolc-artifact-1";
const ZKVYPER_ARTIFACT_FORMAT_VERSION = "hh-zkvyper-artifact-1";

export function extractDeployedAddress(receipt: any): Address {
  const filteredLogs = receipt.logs.filter(
    (log: any) => toFunctionSelector('ContractDeployed(address,bytes32,address)') && log.address === contractDeployerAddress
  );
  const contractAddresses = filteredLogs
    .map((log: any) => {
      if (log.topics.length > 3) {
        return `0x${log.topics[3].slice(-addressBytesLength)}`;
      }
      return null;
    })
    .filter((address: Address) => address !== null);

  return contractAddresses[contractAddresses.length - 1];
}

export function formatContractBytecode(
  contractBytecode: string
): `0x${string}` {
  return `0x${contractBytecode}`;
}

export async function extractFactoryDeps(
  hre: HardhatRuntimeEnvironment,
  artifact: ZkSyncArtifact
): Promise<string[]> {
  const visited = new Set<string>();
  visited.add(`${artifact.sourceName}:${artifact.contractName}`);
  return await _extractFactoryDepsRecursive(hre, artifact, visited);
}

async function _extractFactoryDepsRecursive(
  hre: HardhatRuntimeEnvironment,
  artifact: ZkSyncArtifact,
  visited: Set<string>
): Promise<string[]> {
  const factoryDeps: string[] = [];
  for (const dependencyHash in artifact.factoryDeps) {
    if (!dependencyHash) continue;
    const dependencyContract = artifact.factoryDeps[dependencyHash];
    if (!visited.has(dependencyContract)) {
      const dependencyArtifact = await loadArtifact(hre, dependencyContract);
      factoryDeps.push(dependencyArtifact.bytecode);
      visited.add(dependencyContract);
      const transitiveDeps = await _extractFactoryDepsRecursive(
        hre,
        dependencyArtifact,
        visited
      );
      factoryDeps.push(...transitiveDeps);
    }
  }

  return factoryDeps;
}

export async function loadArtifact(
  hre: HardhatRuntimeEnvironment,
  contractNameOrFullyQualifiedName: string
): Promise<ZkSyncArtifact> {
  const artifact = await hre.artifacts.readArtifact(
    contractNameOrFullyQualifiedName
  );

  if (
    artifact._format !== ZKSOLC_ARTIFACT_FORMAT_VERSION &&
    artifact._format !== ZKVYPER_ARTIFACT_FORMAT_VERSION
  ) {
    throw new Error(
      `Artifact ${contractNameOrFullyQualifiedName} was not compiled by zksolc or zkvyper`
    );
  }
  return artifact as ZkSyncArtifact;
}
