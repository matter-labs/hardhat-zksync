import * as ts from 'typescript';
import * as fs from 'fs';
import { ObjectLiteralExpression, Project } from 'ts-morph';
import { HardhatRuntimeEnvironment, HttpNetworkConfig, NetworkConfig } from 'hardhat/types';
import { ContractInfo } from './types';

export function isHttpNetworkConfig(networkConfig: NetworkConfig): networkConfig is HttpNetworkConfig {
    return 'url' in networkConfig;
}

export function updateHardhatConfigFile(hre: HardhatRuntimeEnvironment, libraries: ContractInfo[]) {
    const filePath = hre.config.paths.configFile;
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const project = new Project();
    const sourceFile = project.createSourceFile(filePath, fileContent);

    const configObject = sourceFile.getVariableDeclaration('config');
    const configObjectInitializer = (configObject?.getInitializer());

    console.log(configObjectInitializer);

    // if(configObjectInitializer && configObjectInitializer.getKind() === ts.SyntaxKind.ObjectLiteralExpression) {
    //     const zkSolcObject = configObjectInitializer?.getProperty('zksolc');
    //     const zkSolcInitializer = zkSolcObject?.getInitializer('zksolc');
        
    //     const settingsObject = zkSolcInitializer?.getProperty('settings');
    //     const settingsObjectInitializer = settingsObject?.getInitializer();

    //     const librariesObject = settingsObjectInitializer?.getProperty('libraries');
    //     const librariesObjectInitializer = librariesObject?.setInitializer(libraries);
    // }

    const updatedCode = sourceFile.getText();
    fs.writeFileSync(filePath, updatedCode, 'utf8');
}
