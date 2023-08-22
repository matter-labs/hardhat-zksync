import * as fs from 'fs';
import { ObjectLiteralExpression, Project, SourceFile, SyntaxKind } from 'ts-morph';
import { HardhatRuntimeEnvironment, HttpNetworkConfig, NetworkConfig } from 'hardhat/types';
import { ContractInfo } from './types';

export function isHttpNetworkConfig(networkConfig: NetworkConfig): networkConfig is HttpNetworkConfig {
    return 'url' in networkConfig;
}

export function updateHardhatConfigFile(hre: HardhatRuntimeEnvironment, libraries: ContractInfo[]) {
    const settingsValue = generateHardhatConfigSettings(libraries);

    const filePath = hre.config.paths.configFile;
    const sourceFile = createSourceFile(filePath);

    let zksolcConfig = getZkSolcConfigFromHardhatConfig(sourceFile);

    let settingsConfig = zksolcConfig.getProperty('settings');

    if (!settingsConfig) {
        zksolcConfig.addPropertyAssignment({
            name: 'settings',
            initializer: JSON.stringify(settingsValue, null, 2)
        });

        saveUpdatedConfigFile(filePath, sourceFile);
        return;
    }

    let clonedSettingsConfig = Object.create(settingsConfig);

    let librariesConfig = clonedSettingsConfig
        .getFirstChildByKindOrThrow(SyntaxKind.ObjectLiteralExpression)
        .getProperty('libraries');

    if (!librariesConfig) {
        settingsConfig
            .getFirstChildByKindOrThrow(SyntaxKind.ObjectLiteralExpression)
            .addPropertyAssignment({
                name: 'libraries',
                initializer: JSON.stringify(settingsValue.libraries, null, 2)
            });

        saveUpdatedConfigFile(filePath, sourceFile);
        return;
    }

    librariesConfig = settingsConfig
        .getFirstChildByKindOrThrow(SyntaxKind.ObjectLiteralExpression)
        .getPropertyOrThrow('libraries')
        .asKindOrThrow(SyntaxKind.PropertyAssignment)
        .setInitializer(JSON.stringify(settingsValue.libraries, null, 2));

    saveUpdatedConfigFile(filePath, sourceFile);
}

function getZkSolcConfigFromHardhatConfig(sourceFile: SourceFile): ObjectLiteralExpression {
    let zksolc = sourceFile.getVariableDeclaration('config')
        ?.getInitializer()
        ?.asKindOrThrow(SyntaxKind.ObjectLiteralExpression)
        .getPropertyOrThrow('zksolc')
        .getFirstChildByKindOrThrow(SyntaxKind.ObjectLiteralExpression);

    if (!zksolc) {
        throw new Error('zksolc not found in config object of hardhat.config.ts');
    }

    return zksolc;
}

function createSourceFile(filePath: string): SourceFile {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const project = new Project();
    return project.createSourceFile(filePath, fileContent, { overwrite: true });
}

function saveUpdatedConfigFile(filePath: string, sourceFile: SourceFile) {
    const updatedCode = sourceFile.getText();
    fs.writeFileSync(filePath, updatedCode, 'utf8');
}

function generateHardhatConfigSettings(libraries: ContractInfo[]): HardhatConfigSettings {
    const librarySettings: HardhatConfigLibraries = {};
    libraries.forEach((library) => {
        librarySettings[library.contractName] = { [library.cleanContractName]: library.adress };
    });

    return { libraries: librarySettings };
}

interface HardhatConfigSettings {
    libraries: HardhatConfigLibraries;
}

interface HardhatConfigLibraries {
    [contractName: string]: {
        [libraryName: string]: string;
    }
}

