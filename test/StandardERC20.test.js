const { ethers } = require('hardhat')
const { expect, use } = require('chai')
const { loadFixture } = require('@nomicfoundation/hardhat-toolbox/network-helpers')

describe(`StandardERC20 tests`, function () {
  async function deployGiantAiTokenFixture() {
    const [owner] = await ethers.getSigners()

    const tokenFactory = await ethers.getContractFactory('StandardERC20', owner)
    const giantAiContract = await tokenFactory
      .connect(owner)
      .deploy('Friendly Giant AI', 'GIANTAI', ethers.parseEther('1000000000'))

    const giantAiContractAddress = await giantAiContract.getAddress()

    return { owner, giantAiContract, giantAiContractAddress }
  }

  async function deployIspolinkTokenFixture() {
    const [_, ispOwner] = await ethers.getSigners()

    const tokenFactory = await ethers.getContractFactory('StandardERC20', ispOwner)
    const ispContract = await tokenFactory
      .connect(ispOwner)
      .deploy('Ispolink', 'ISP', ethers.parseEther('1000000000'))

    const ispContractAddress = await ispContract.getAddress()

    return { ispOwner, ispContract, ispContractAddress }
  }

  it('MisfundRecovery.recoverERC20() should successfully return tokens to sender', async function () {
    const { owner, giantAiContract, giantAiContractAddress } =
      await loadFixture(deployGiantAiTokenFixture)
    const { ispOwner, ispContract, ispContractAddress } = await loadFixture(
      deployIspolinkTokenFixture
    )

    // Send ISP tokens to GIANTAI contract address
    const ispAmount = ethers.parseEther('1000')
    await ispContract.connect(ispOwner).transfer(giantAiContractAddress, ispAmount)
    expect(await ispContract.balanceOf(giantAiContractAddress)).to.equal(ispAmount)

    // Only GIANTAI contract owner should be able to invoke this method
    await expect(
      giantAiContract
        .connect(ispOwner)
        .recoverERC20(ispContractAddress, ispOwner.address, ispAmount)
    ).to.be.revertedWithCustomError(giantAiContract, 'OwnableUnauthorizedAccount')

    await expect(
      giantAiContract.connect(owner).recoverERC20(ispContractAddress, ispOwner.address, ispAmount)
    ).not.to.be.reverted
  })
})
