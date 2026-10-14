
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.20",

  paths: {
    tests: "./tests"
  },

  networks: {
    hardhat: {
      chainId: 31337
    }
  }
};
