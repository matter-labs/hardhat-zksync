import { assert } from 'chai';
import { useEnvironment } from './helpers';
import { ContractFactory } from 'zksync-web3';

describe('Upgradable plugin tests', async function () {
    describe('Transparent upgradable proxy deployment', async function () {
        useEnvironment('e2e', 'hardhat');

        it('Should deploy proxy and contract implementation', async function () {
            const contractName = 'Box';
            console.log('Deploying ' + contractName + '...');

            const contract = await this.deployer.loadArtifact(contractName);
            const box = await this.env.zkUpgrades.deployProxy(this.deployer.zkWallet, contract, [42], {
                initializer: 'store',
            });

            await box.deployed();
            console.log(contractName + ' deployed to:', box.address);

            box.connect(this.deployer.zkWallet);
            const value = await box.retrieve();
            console.log('Box value is: ', value.toNumber());
            assert.equal(value.toNumber(), 42);
        });

        it('Should update proxy contract implementation', async function () {
            const contractName1 = 'Box';
            const contractName2 = 'BoxV2';
            console.log('Deploying ' + contractName1 + '...');

            const contract = await this.deployer.loadArtifact(contractName1);
            const box1Proxy = await this.env.zkUpgrades.deployProxy(this.deployer.zkWallet, contract, [42], {
                initializer: 'store',
            });

            const BoxV2 = await this.deployer.loadArtifact(contractName2);
            const box2 = await this.env.zkUpgrades.upgradeProxy(this.deployer.zkWallet, box1Proxy.address, BoxV2);
            console.log('Successfully upgraded Box to BoxV2');

            box2.connect(this.deployer.zkWallet);
            const value = await box2.retrieve();
            assert.equal(value, 'V2: 42');
        });
        it('Should deploy beacon proxy and contract implementation', async function () {
            const contractName = 'Box';
            const contract = await this.deployer.loadArtifact(contractName);

            const beacon = await this.env.zkUpgrades.deployBeacon(this.deployer.zkWallet, contract);
            await beacon.deployed();
            console.log('Beacon deployed to:', beacon.address);

            const box = await this.env.zkUpgrades.deployBeaconProxy(this.deployer.zkWallet, beacon, contract, [42]);
            await box.deployed();
            console.log(contractName + ' proxy deployed to:', box.address);

            box.connect(this.deployer.zkWallet);
            const value = await box.retrieve();
            assert(value.toNumber() === 42);
        });
        it('Should upgrade beacon proxy contract implementation ', async function () {
            const contractName = 'Box';
            const contract = await this.deployer.loadArtifact(contractName);

            const beacon = await this.env.zkUpgrades.deployBeacon(this.deployer.zkWallet, contract);
            await beacon.deployed();
            console.log('Beacon deployed to:', beacon.address);

            const beaconProxy = await this.env.zkUpgrades.deployBeaconProxy(this.deployer.zkWallet, beacon, contract, [
                42,
            ]);
            await beaconProxy.deployed();

            const implContractName = 'BoxV2';
            const boxV2Implementation = await this.deployer.loadArtifact(implContractName);

            await this.env.zkUpgrades.upgradeBeacon(this.deployer.zkWallet, boxV2Implementation, beacon.address);
            console.log('Successfully upgraded beacon Box to BoxV2 on address: ', beacon.address);

            const attachTo = new ContractFactory(
                boxV2Implementation.abi,
                boxV2Implementation.bytecode,
                this.deployer.zkWallet,
                this.deployer.deploymentType
            );
            const box = await attachTo.attach(beaconProxy.address);

            box.connect(this.deployer.zkWallet);
            // wait 2 seconds before the next call
            await new Promise((resolve) => setTimeout(resolve, 2000));
            const value = await box.retrieve();
            assert(value === 'V2: 42');
        });
    });
});
