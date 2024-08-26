import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments} = hre;
  const {deploy} = deployments;


await deploy('TwoUserMultisig', {
    from: "0x36615Cf349d7F6344891B1e7CA7C72883F5dc049",
    args: ["0xa83114A443dA1CecEFC50368531cACE9F37fCCcb","0x9B9Ce3386D5157Bd064480e683D79698B37f6563"],
    log: true,
  });
};

export default func;
