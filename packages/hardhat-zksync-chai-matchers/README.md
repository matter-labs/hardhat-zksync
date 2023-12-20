# hardhat-zksync-chai-matchers 🚀

zkSync Era's integration into the [Chai](https://chaijs.com/) assertion library is enabled by this [Hardhat](https://hardhat.org/) plugin, adding capabilities that make writing and reading smart contract tests easy."

![Era Logo](https://github.com/matter-labs/era-contracts/raw/main/eraLogo.svg)

## ⚠️ Version Compatibility Warning

Ensure you are using the correct version of the plugin with ethers:
- For plugin version **<1.0.0**:
  - Compatible with ethers **v5**.

- For plugin version **≥1.0.0**:
  - Compatible with ethers **v6** (⭐ Recommended)

## 📥 Installation

To install **hardhat-zksync-chai-matchers** plugin, run:

`npm install -D @matterlabs/hardhat-zksync-chai-matchers`

or

`yarn add -D @matterlabs/hardhat-zksync-chai-matchers @nomicfoundation/hardhat-chai-matchers chai @nomiclabs/hardhat-ethers ethers`

## 📖 Usage

After installing it, add the plugin to your Hardhat config:

`import "@matterlabs/hardhat-zksync-chai-matchers";`

Then you'll be able to use the matchers in your tests.

**changeEtherBalance**

Assert that the ether balance of an address changed by a specific amount:

```
await expect(() =>
  sender.transfer({
    to: receiver.address,
    amount: 2000,
  })
).to.changeEtherBalance(sender.address, -2000);
```

**changeTokenBalance**

Assert that an ERC20 token balance of an address changed by a specific amount:

```
await expect(sender.transfer({ to: receiver.address, amount: 5, token: token.address })).to.changeTokenBalance(token, sender, -5);

await expect(token.transfer(receiver.address, 5)).to.not.changeTokenBalance(token, sender, 0);
```

**revertedWithCustomError**

Assert that a transaction reverted with a specific custom error:

```
await expect(contract.setAmount(100)).to.be.reverted;
```

You can also use regular chai matchers like:


```
await expect(contract.setAmount(100)).to.emit(contract, "AmountUpdated");

expect("0x36615Cf349d7F6344891B1e7CA7C72883F5dc049").to.be.properAddress;

expect(await contract.getAmount()).to.equal(100);

```

## 📝 Documentation

In addition to the [hardhat-zksync-chai-matchers](https://era.zksync.io/docs/tools/hardhat/hardhat-zksync-chai-matchers.html), zkSync's Era [website](https://era.zksync.io/docs/) offers a variety of resources including:

[Guides to get started](https://era.zksync.io/docs/dev/building-on-zksync/hello-world.html): Learn how to start building on zkSync Era.\
[Hardhat zkSync Era plugins](https://era.zksync.io/docs/tools/hardhat/getting-started.html): Overview and guides for all Hardhat zkSync Era plugins.\
[Hyperscaling](https://era.zksync.io/docs/reference/concepts/hyperscaling.html#what-are-hyperchains): Deep dive into hyperscaling on zkSync Era.

## 🤝 Contributing

Contributions are always welcome! Feel free to open any issue or send a pull request.

Go to [CONTRIBUTING.md](https://github.com/matter-labs/hardhat-zksync/blob/main/.github/CONTRIBUTING.md) to learn about steps and best practices for contributing to zkSync hardhat tooling base repository.  


## 🙌 Feedback, help and news

[zkSync Era Discord server](https://join.zksync.dev/): for questions and feedback.\
[Follow zkSync Era on Twitter](https://twitter.com/zksync)

## Happy building!