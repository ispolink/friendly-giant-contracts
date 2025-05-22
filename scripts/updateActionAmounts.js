const hre = require('hardhat')
const ethers = require('ethers')

const readline = require('node:readline/promises')
const process = require('node:process')

const { collectActionAmounts, submitActionAmounts } = require('./modules/blockchain')

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
    `Updating price actions for XRequestProcessor deployment: ${requestProcessorAddress} on ${networkName}`
  )

  const actionsDto = await collectActionAmounts(cliReader)
  actionsDto.preview()

  const proceedWithTransaction = await cliReader.question('Do you wish to proceed? [y]: ')
  if (proceedWithTransaction !== '' && proceedWithTransaction.slice(0, 1) !== 'y') {
    console.log('Aborting operation.')
    return
  }

  console.log('Publishing specified action prices...')
  const txData = await submitActionAmounts(actionsDto, requestProcessorAddress, walletSigner)
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
