import { HardhatRuntimeEnvironment } from 'hardhat/types';

const deployScript = async function (_: HardhatRuntimeEnvironment) {
    console.log('Deploy script');
};

export default deployScript;
deployScript.priority = 1000;
