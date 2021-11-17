export interface ZkSolcConfig {
  version: string; // Currently ignored.
  compilerSource: "binary"; // Later "docker" variant will also be supported.
  settings: {
    optimizer: {
      enabled: boolean;
    };
  };
}
