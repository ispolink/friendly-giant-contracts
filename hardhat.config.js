require('dotenv').config()
require('@nomicfoundation/hardhat-toolbox')

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
const hardhatConfig = {
  solidity: '0.8.27',
  networks: {
    hardhat: {
      initialBaseFeePerGas: 0, // hardhat london fork error fix for coverage
      chainId: 31337,
    },
    ethereum: {
      url: 'https://eth.llamarpc.com',
      chainId: 1,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    base: {
      url: 'https://mainnet.base.org/',
      chainId: 8453,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    polygon: {
      url: 'https://polygon-rpc.com/',
      chainId: 137,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    sepolia: {
      url: 'https://1rpc.io/sepolia',
      chainId: 11155111,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    baseSepolia: {
      url: 'https://sepolia.base.org/',
      chainId: 84532,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    polygonAmoy: {
      url: 'https://rpc-amoy.polygon.technology/',
      chainId: 80002,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY ? process.env.ETHERSCAN_API_KEY : undefined,
  },
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
}

module.exports = hardhatConfig
