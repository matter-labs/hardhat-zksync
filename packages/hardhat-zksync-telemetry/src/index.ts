import { extendEnvironment, task } from 'hardhat/config';
import { Telemetry } from '@matterlabs/zksync-telemetry-js';

const TELEMETRY_CONFIG_NAME = 'zksync-tooling';
const POSTHOG_API_KEY = 'phc_nUZ2xCocs20EXLd8nrRGbzWv46txGI7IsvOl5mBaLuq';

declare global {
    // eslint-disable-next-line no-var
    var telemetryInstance: Telemetry | undefined;
}

if (!global.telemetryInstance) {
    const telemetry = Telemetry.initialize(
        'hardhat-zksync',
        require('../package.json').version,
        TELEMETRY_CONFIG_NAME,
        POSTHOG_API_KEY,
    );
    global.telemetryInstance = telemetry;

    extendEnvironment((hre) => {
        for (const [taskName, taskDefinition] of Object.entries(hre.tasks)) {
            if (taskDefinition.isSubtask || taskName === 'help') {
                continue;
            }
            task(taskName, taskDefinition.description).setAction(async (args, _, runSuper) => {
                let result = 'success';
                try {
                    return await runSuper(args);
                } catch (error) {
                    result = 'failure';
                    try {
                        const err = new Error((error as Error).message);
                        delete err.stack;
                        telemetry.trackError(err, { task: taskName });
                    } catch {}
                    throw error;
                } finally {
                    try {
                        telemetry.trackEvent('task_executed', { name: taskName, result });
                        await telemetry.shutdown();
                    } catch {}
                }
            });
        }
    });
}

export default global.telemetryInstance;
