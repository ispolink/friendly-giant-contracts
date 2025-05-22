const readline = require('node:readline/promises')
const process = require('node:process')

const hre = require('hardhat')
const ethers = require('ethers')

const { collectActionAmounts, submitActionAmounts } = require('./modules/blockchain')

const cliReader = readline.createInterface({ input: process.stdin, output: process.stdout })

async function main() {
  const chainId = hre.network.config.chainId
  const rpcUrl = hre.network.config.url
  const provider = new ethers.JsonRpcProvider(rpcUrl)

  const privateKey = process.env.PRIVATE_KEY || 'YOUR_PRIVATE_KEY'
  const wallet = new hre.ethers.Wallet(privateKey)
  const walletSigner = wallet.connect(provider)

  const networkName = hre.network.name
    .replace(/(?<=[a-z])(?=[A-Z])/g, ' ')
    .split(' ')
    .map(s => `${s[0].toUpperCase()}${s.slice(1)}`)
    .join(' ')

  const walletBalance = await provider.getBalance(wallet.address)
  console.log(`Preparing to deploy XRequestProcessor on ${networkName}`)
  console.log(`Wallet balance: ${ethers.formatEther(walletBalance)}`)

  const erc20TokenAddress =
    process.env.ERC20_ADDRESS || (await cliReader.question('Enter ERC20 token address: ')).trim()
  if (!ethers.isAddress(erc20TokenAddress)) {
    console.log('Invalid ERC20 address. Aborting.')
    return
  }

  const actionsDto = await collectActionAmounts(cliReader)
  actionsDto.preview()

  const proceedWithDeployment = await cliReader.question('Do you wish to proceed? [y]: ')
  if (proceedWithDeployment !== '' && proceedWithDeployment.slice(0, 1) !== 'y') {
    console.log('Aborting deployment.')
    return
  }

  const requestProcessorContract = await hre.ethers.deployContract('XRequestProcessor', [erc20TokenAddress])
  await requestProcessorContract.waitForDeployment()

  const requestProcessorAddress = await requestProcessorContract.getAddress()
  console.log(`XRequestProcessor deployed at: ${requestProcessorAddress}`)
  console.log()

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
