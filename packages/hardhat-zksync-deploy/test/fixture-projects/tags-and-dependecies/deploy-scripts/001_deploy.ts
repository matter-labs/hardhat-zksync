import { HardhatRuntimeEnvironment } from 'hardhat/types';

const deployScript = async function (_: HardhatRuntimeEnvironment) {
    console.log('Deploy script');
};

export default deployScript;
deployScript.tags = ['second', 'all'];
deployScript.dependencies = ['first'];