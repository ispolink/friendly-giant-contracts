const hre = require('hardhat')
const ethers = require('ethers')

const readline = require('node:readline/promises')
const process = require('node:process')

const { RequestActionsDto } = require('./modules/blockchain')

const X_REQUEST_PROCESSOR_ABI =
  require('../artifacts/contracts/XRequestProcessor.sol/XRequestProcessor.json').abi

const cliReader = readline.createInterface({ input: process.stdin, output: process.stdout })

async function main() {
  const chainId = hre.network.config.chainId
  const rpcUrl = hre.network.config.url
  const provider = new ethers.JsonRpcProvider(rpcUrl)

  const requestProcessorAddress =
    process.env.XREQUEST_PROCESSSOR_ADDRESS ||
    (await cliReader.question(`Enter XRequestProcessor address": `)).trim()
  if (!ethers.isAddress(requestProcessorAddress)) {
    console.log('Invalid XRequestProcessor address. Aborting.')
    return
  }

  const networkName = hre.network.name
    .replace(/(?<=[a-z])(?=[A-Z])/g, ' ')
    .split(' ')
    .map(s => `${s[0].toUpperCase()}${s.slice(1)}`)
    .join(' ')

  const contract = new ethers.Contract(requestProcessorAddress, X_REQUEST_PROCESSOR_ABI, provider)
  console.log(`Retrieving XRequestProcessor price actions on ${networkName}:`)

  const actionPrices = await contract.getActionPriceAll()
  const actionPricesDto = new RequestActionsDto(...actionPrices)
  actionPricesDto.preview()
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => {
    cliReader.close()
  })
