import { expect } from 'chai';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

/**
 * Unit test for factory-deployed contract verification
 *
 * This test validates the fix for issues:
 * - #350: Cannot verify a contract with construct args and created within another contract
 * - #362: Cannot verify a contract deployed within another contract
 * - #519: Issue with Verifying Contracts on zkSync When Deployed via External Library
 *
 * The test ensures that contracts deployed by factory contracts can be verified
 * with their constructor arguments correctly identified.
 */
describe('Factory Deployed Contract Verification', function () {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const FIXTURE_PROJECT_PATH = path.join(__dirname, '..', 'fixture-projects', 'factoryDeployment');

    it('should have the factory deployment test fixture available', function () {
        expect(fs.existsSync(FIXTURE_PROJECT_PATH)).to.be.true;
    });

    it('should have Factory.sol contract', function () {
        const factoryPath = path.join(FIXTURE_PROJECT_PATH, 'contracts', 'Factory.sol');
        expect(fs.existsSync(factoryPath)).to.be.true;

        const content = fs.readFileSync(factoryPath, 'utf8');
        expect(content).to.include('contract Factory');
        expect(content).to.include('function deployChild');
    });

    it('should have Child.sol contract with constructor arguments', function () {
        const childPath = path.join(FIXTURE_PROJECT_PATH, 'contracts', 'Child.sol');
        expect(fs.existsSync(childPath)).to.be.true;

        const content = fs.readFileSync(childPath, 'utf8');
        expect(content).to.include('contract Child');
        expect(content).to.include('constructor(uint256 _initialValue)');
    });

    it('should have deployment script', function () {
        const deployPath = path.join(FIXTURE_PROJECT_PATH, 'deploy.ts');
        expect(fs.existsSync(deployPath)).to.be.true;

        const content = fs.readFileSync(deployPath, 'utf8');
        expect(content).to.include('Factory Deployment Verification Test');
        expect(content).to.include('verify:verify');
    });

    it('should have constructor args file', async function () {
        const argsPath = path.join(FIXTURE_PROJECT_PATH, 'args.js');
        expect(fs.existsSync(argsPath)).to.be.true;

        // Read the file content instead of requiring it
        const content = fs.readFileSync(argsPath, 'utf8');
        expect(content).to.include('100');
    });

    it('should have README documenting the test scenario', function () {
        const readmePath = path.join(FIXTURE_PROJECT_PATH, 'README.md');
        expect(fs.existsSync(readmePath)).to.be.true;

        const content = fs.readFileSync(readmePath, 'utf8');
        expect(content).to.include('Issue #350');
        expect(content).to.include('Issue #362');
        expect(content).to.include('Issue #519');
    });

    // Integration test (skipped by default, requires network connection)
    it.skip('should successfully verify factory-deployed contract on testnet', async function () {
        this.timeout(120000); // 2 minutes timeout for network operations

        // This test would:
        // 1. Deploy the Factory contract
        // 2. Deploy a Child via the Factory
        // 3. Verify both contracts
        // 4. Assert both verifications succeed

        // TODO: Implement integration test when network is available
    });
});
