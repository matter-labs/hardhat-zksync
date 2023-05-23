/**
 * Runs hardhat-etherscan plugin's verify command on the given implementation address.
 *
 * @param hardhatVerify A function that invokes the hardhat-etherscan plugin's verify command
 * @param implAddress The implementation address
 * @param errorReport Accumulated verification errors
 */
async function verifyImplementation(
    hardhatVerify: (address: string) => Promise<any>,
    implAddress: string,
  ) {
    try {
      console.log(`Verifying implementation: ${implAddress}`);
      await hardhatVerify(implAddress);
    } catch (e: any) {
      if (e.message.toLowerCase().includes('already verified')) {
        console.log(`Implementation ${implAddress} already verified.`);
      } else {
        // recordVerificationError(implAddress, 'implementation', e.message, errorReport);
        //FIXME: change this
        console.log(e);
      }
    }
  }
  