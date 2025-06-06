const readline = require('node:readline/promises')
const process = require('node:process')

const hre = require('hardhat')
const ethers = require('ethers')

const { humanReadableAmount } = require('./modules/utils')

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
  console.log(`Preparing to deploy ERC20 on ${networkName}`)
  console.log(`Wallet balance: ${ethers.formatEther(walletBalance)}`)
  console.log()

  const name = (await cliReader.question('Enter ERC20 name: ')).trim()
  const symbol = (await cliReader.question('Enter ERC20 symbol (e.g. TICKER): ')).trim()
  const supplyWei = ethers.parseUnits((await cliReader.question('Enter ERC20 supply: ')).trim())

  console.log()
  console.log(
    `Preparing deployment of ERC20: ${name}, Symbol: ${symbol}, Supply: ${humanReadableAmount(supplyWei)}`
  )
  console.log()

  const proceedWithDeployment = await cliReader.question('Do you wish to proceed? [y]: ')
  if (proceedWithDeployment !== '' && proceedWithDeployment.slice(0, 1) !== 'y') {
    console.log('Aborting deployment.')
    return
  }

  const erc20Contract = await hre.ethers.deployContract('StandardERC20', [name, symbol, supplyWei])
  await erc20Contract.waitForDeployment()

  const erc20Address = await erc20Contract.getAddress()
  console.log(`ERC20 deployed at: ${erc20Address}`)
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
