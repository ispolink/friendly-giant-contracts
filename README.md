# Friendly Giant AI - Smart Contracts

This project contains core Friendly Giant AI smart contracts and helper scripts for deployment and interaction.


## Installation

Project created with Node v22.14.0

```
nvm use "$(cat .nvmrc)"
npm ci
```


## Compiling the contracts

```
npx hardhat compile
```


## Environment variables

To populate the environment variables, create a fail named `.env`. Use `.env.example` as a template.


## Running with local blockchain

Boostrap a local blockchain on your PC. The `chainId` of the local network can be found in `hardhat.config.js`.

```
npx hardhat node
```


## Deployment

Populate your `.env` file or specify required env variables in the command directly.

### XRequestProcessor contract

```
PRIVATE_KEY="0xPRIVATE_KEY" ERC20_ADDRESS="0xERC20_ADDRESS" npx hardhat run --network localhost scripts/deploy.js
```

### ERC20 contract

```
PRIVATE_KEY="0xPRIVATE_KEY" npx hardhat run --network localhost scripts/deploy.js
```

To deploy on another chain, specify the network key name (e.g. `baseSepolia`) from `hardhat.config.js`.


## Interacting with deployed contracts

### XRequestProcessor contract

Populate your `.env` file or specify required env variables in the command directly.

To check the current price actions on a deployed contract instance:

```
XREQUEST_PROCESSSOR_ADDRESS="0xPROCESSOR_ADDRESS" npx hardhat run --network base scripts/getActionAmounts.js
```

To update the price actions on a deployed contract instance:

```
PRIVATE_KEY="0xPRIVATE_KEY" XREQUEST_PROCESSSOR_ADDRESS="0xPROCESSOR_ADDRESS" npx hardhat run --network base scripts/updateActionAmounts.js
```


## Verify deployed contracts

Populate `BASE_API_VERIFY_KEY` or other, depending on the deployed network

To verify run:

```
BASE_API_VERIFY_KEY="API_KEY" npx hardhat verify "DEPLOYED_CONTRACT_ADDR" --network base "Constructor arg 1" "Constructor arg 2"
```

To list all supported networks by hardhat and their chainIds:

```
npx hardhat verify --list-networks
```


## Testing

To run unit and integration tests:

```
npx hardhat test
```


## Code formatting

This project uses `prettier` to format JavaScript and Solidity source files:

- Reformat JS and SOL files: `npm run prettify`
- Reformat JS files: `npm run prettify:js`
- Reformat SOL files: `npm run prettify:sol`
