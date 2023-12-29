import chalk from 'chalk';

export async function verifyImplementation(
    hardhatVerify: (address: string) => Promise<any>,
    implAddress: string,
    quiet: boolean = false,
) {
    try {
        if (!quiet) {
            console.info(chalk.cyan(`Verifying implementation: ${implAddress}`));
        }
        await hardhatVerify(implAddress);
    } catch (e: any) {
        if (e.message.toLowerCase().includes('already verified')) {
            console.error(chalk.red(`Implementation on address ${implAddress} already verified.`));
        } else {
            console.error(chalk.red(e));
        }
    }
}
