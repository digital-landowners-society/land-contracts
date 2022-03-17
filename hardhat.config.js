require("dotenv").config();

require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");

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
  networks: {
    rinkeby: {
      url: process.env.RINKEBY_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
    // mainnet: {
    //   url: process.env.MAINNET_URL,
    //   accounts:
    //     process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    // },
    // development: {
    //   url: "http://127.0.0.1:8545/",
    //   accounts: [process.env.LOCAL_PRIVATE_KEY],
    // },
  },
  // defaultNetwork: "development",
  gasReporter: {
    enabled: true,
    currency: "USD",
    coinmarketcap: "63127161-7293-4c3f-82f2-189677b67ea0",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
