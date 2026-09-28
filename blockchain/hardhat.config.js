require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const { RPC_URL, ISSUER_PRIVATE_KEY, ETHERSCAN_API_KEY } = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    sepolia: {
      url: RPC_URL || "",
      accounts: ISSUER_PRIVATE_KEY ? [ISSUER_PRIVATE_KEY] : [],
    },
  },
  etherscan: { apiKey: ETHERSCAN_API_KEY || "" },
};
