import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments} = hre;
  const {deploy} = deployments;


await deploy('Import', {
    from: "0x36615Cf349d7F6344891B1e7CA7C72883F5dc049",
    args: [],
    log: true,
  });
};

export default func;
