import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { getDeployData } from '../proxy-deployment/deploy-impl';
import { ValidateImplementationFunction } from '../interfaces';
import { ValidateImplementationOptions } from '../utils/options';
import { validateImpl } from './validate-impl';

export function makeValidateImplementation(hre: HardhatRuntimeEnvironment): ValidateImplementationFunction {
    return async function validateImplementation(ImplFactory, opts: ValidateImplementationOptions = {}) {
        const deployData = await getDeployData(hre, ImplFactory, opts);
        await validateImpl(deployData, opts);
    };
}
