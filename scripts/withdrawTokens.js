const hre = require('hardhat')
const ethers = require('ethers')

const readline = require('node:readline/promises')
const process = require('node:process')

const { humanReadableAmount } = require('./modules/utils')

const X_REQUEST_PROCESSOR_ABI =
  require('../artifacts/contracts/XRequestProcessor.sol/XRequestProcessor.json').abi

const ERC20_ABI = require('../artifacts/contracts/StandardERC20.sol/StandardERC20.json').abi

const cliReader = readline.createInterface({ input: process.stdin, output: process.stdout })

async function main() {
  const chainId = hre.network.config.chainId
  const rpcUrl = hre.network.config.url
  const provider = new ethers.JsonRpcProvider(rpcUrl)

  const privateKey = process.env.PRIVATE_KEY || 'YOUR_PRIVATE_KEY'
  const wallet = new hre.ethers.Wallet(privateKey)
  const walletSigner = wallet.connect(provider)

  const requestProcessorAddress =
    process.env.XREQUEST_PROCESSOR_ADDRESS ||
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

  console.log(
    `Loading ERC20 balance in XRequestProcessor deployed at: ${requestProcessorAddress} on ${networkName}`
  )
  console.log()

  const requestProcessorContract = new ethers.Contract(
    requestProcessorAddress,
    X_REQUEST_PROCESSOR_ABI,
    walletSigner
  )

  const erc20TokenAddress = await requestProcessorContract.getPaymentTokenAddress()
  const erc20Contract = new ethers.Contract(erc20TokenAddress, ERC20_ABI, walletSigner)
  const erc20Name = await erc20Contract.name()
  const erc20Symbol = await erc20Contract.symbol()
  const erc20Supply = await erc20Contract.totalSupply()
  console.log(`ERC20 Address: ${erc20TokenAddress}`)
  console.log(`ERC20 Name: ${erc20Name}`)
  console.log(`ERC20 Symbol: ${erc20Symbol}`)
  console.log(`ERC20 Supply: ${humanReadableAmount(erc20Supply)}`)
  console.log()

  const requestProcessorBalance = await erc20Contract.balanceOf(requestProcessorAddress)
  console.log(
    `XRequestProcessor $${erc20Symbol} balance: ${humanReadableAmount(requestProcessorBalance)}`
  )

  if (requestProcessorBalance === 0n) {
    console.log('Empty balance, nothing to withdraw')
    return
  }

  console.log(`Preparing withdrawal of all XRequestProcessor contract $${erc20Symbol} tokens...`)
  const withdrawAddress = (await cliReader.question('Enter withdraw address: ')).trim()
  if (!ethers.isAddress(withdrawAddress)) {
    console.log('Invalid ERC20 address. Aborting.')
    return
  }

  const proceedAction = await cliReader.question('Do you wish to proceed? [y]: ')
  if (proceedAction !== '' && proceedAction.slice(0, 1) !== 'y') {
    console.log('Aborting withdrawal.')
    return
  }

  const txData = await requestProcessorContract.withdrawFunds(withdrawAddress)
  console.log(`TX: ${txData.hash}`)
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
