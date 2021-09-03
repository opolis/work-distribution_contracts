require("@nomiclabs/hardhat-waffle");
require('hardhat-abi-exporter');
require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-etherscan");
const config = require("./config.json");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.4",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    polygon: {
      url: "https://rpc-mainnet.maticvigil.com",
      accounts: [config.privateKey],
      gasPrice: 8000000000,
    },
    mumbai: {
      url: "https://rpc-mumbai.matic.today",
      accounts: [config.privateKey],
      gasPrice: 8000000000,
    },
    ropsten: {
      url: "https://eth-ropsten.alchemyapi.io/v2/CCx5k2KtxjdlVhvv5admqoiDnhHFRms4",
      accounts: [config.privateKey],
    },
  },
  abiExporter: {
    path: './abis',
    clear: true,
    flat: true,
    only: [],
    spacing: 2
  },
  gasReporter: {
    currency: 'USD',
    gasPrice: 5,
    excludeContracts: ['contracts/test']
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: config.etherscan
  }
};
