# Contributing

## Welcome! 👋

Hello there, contributor! We're delighted that you're considering contributing to the `hardhat-zksync` project. This document is here to guide you through the steps and best practices for contributing to hardhat tooling base repository.

Please take a moment to review this document to ensure a smooth and efficient contribution process for everyone involved.

## Getting Started

- **Fork the repository.** Begin by forking the main `hardhat-zksync` repository to your personal GitHub account.

- **Clone the repository.** After forking, clone the repository to your local machine:

```bash
git clone https://github.com/<your-github-username>/hardhat-zksync.git
```

- **Create a new branch.** Use descriptive names for your branches to help identify the feature, bugfix, or enhancement you're addressing:

```bash
git checkout -b feature/description-of-your-feature
```

## Making Changes

- **Write your code.** Ensure your code is thoroughly tested and functions as expected. Clear, well-commented code is always appreciated.

- **Compile and test.** Before submitting a pull request, ensure your code compiles, passes lint checks, and all tests are successful. You should also write unit tests for your contributions. Use the following command for these checks:

```bash
yarn lint
yarn test
yarn build
```

- **Commit your changes.** Adhere to the [Conventional Commits](https://www.conventionalcommits.org/) standard when writing commit messages.

- **Push your changes.** Push the changes to your forked repository:

```bash
git push origin feature/description-of-your-feature
```

## Submitting a Pull Request

- **Initiate a pull request (PR).** Go to the main `hardhat-zksync` repository. Your recently pushed branch should be highlighted, showing a "Compare & pull request" button. Click on it and provide a clear, detailed description of your changes in the PR.

- **Await a review.** Our maintainers will review your PR. They might request changes or clarifications, so be ready to address any feedback.

## Code Style Guide

We follow basic coding style guidelines. Before committing, ensure your code is formatted and lint checks pass:

```bash
yarn lint
yarn lint:fix
```

This ensures consistent code style throughout the project and helps identify potential issues early.

## Need Assistance?

If you're unsure about something or have questions, don't hesitate to open an issue or initiate a discussion in our [zkSync Community Hub](https://github.com/zkSync-Community-Hub/zkSync-developers/discussions). We're here to assist!

## What's Next?

Once your PR is approved and merged, your contribution will be integrated into the `hardhat-zksync` repository. Congratulations, and thank you! We value your contribution and look forward to future collaborations.

Remember, the best contributions come from enjoying the process, being respectful, and continuously learning. Thanks for being a part of our community!

---

*Last updated: November 29, 2023*