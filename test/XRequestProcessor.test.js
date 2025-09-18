const { ethers } = require('hardhat')
const { expect, use } = require('chai')
const { loadFixture } = require('@nomicfoundation/hardhat-toolbox/network-helpers')

const tokenName = 'Friendly Giant AI'
const tokenSymbol = 'GIANTAI'
const tokenSupply = ethers.parseEther('1000000000')

const likeAmount = ethers.parseEther('10000')
const replyAmount = ethers.parseEther('20000')
const replyToThreadAmount = ethers.parseEther('30000')
const repostAmount = ethers.parseEther('40000')
const repostWithCommentAmount = ethers.parseEther('50000')
const tokenAnalysisAmount = ethers.parseEther('100000')

const XActionType = {
  Like: 0,
  Reply: 1,
  ReplyToThread: 2,
  Repost: 3,
  RepostWithComment: 4,
  TokenAnalysis: 5,
}

/**
 * @param {bigint} totalAmount
 * @param {bigint} burnPercentage
 * @returns {[bigint, bigint]}
 */
const applyBurnPercentage = (totalAmount, burnPercentage) => {
  const burnAmount = (totalAmount * burnPercentage) / 100n
  const remainingAmount = totalAmount - burnAmount
  return [remainingAmount, burnAmount]
}

describe(`XRequestProcessor tests`, function () {
  async function deployXRequestProcessorFixture() {
    const [owner, user1] = await ethers.getSigners()

    const tokenFactory = await ethers.getContractFactory('StandardERC20', owner)
    const tokenContract = await tokenFactory
      .connect(owner)
      .deploy(tokenName, tokenSymbol, tokenSupply)
    const tokenAddress = await tokenContract.getAddress()

    const processorFactory = await ethers.getContractFactory('XRequestProcessor', owner)
    const processorContract = await processorFactory.connect(owner).deploy(tokenAddress)

    // Init token amounts for each action
    await processorContract.setActionPriceAll(
      likeAmount,
      replyAmount,
      replyToThreadAmount,
      repostAmount,
      repostWithCommentAmount,
      tokenAnalysisAmount
    )

    return { owner, user1, processorContract, tokenContract }
  }

  it('getActionPrice() should return the correct amounts', async function () {
    const { processorContract } = await loadFixture(deployXRequestProcessorFixture)

    const like = await processorContract.getActionPrice(XActionType.Like)
    const reply = await processorContract.getActionPrice(XActionType.Reply)
    const replyToThread = await processorContract.getActionPrice(XActionType.ReplyToThread)
    const repost = await processorContract.getActionPrice(XActionType.Repost)
    const repostWithComment = await processorContract.getActionPrice(XActionType.RepostWithComment)
    const tokenAnalysis = await processorContract.getActionPrice(XActionType.TokenAnalysis)

    expect(like).to.equal(likeAmount)
    expect(reply).to.equal(replyAmount)
    expect(replyToThread).to.equal(replyToThreadAmount)
    expect(repost).to.equal(repostAmount)
    expect(repostWithComment).to.equal(repostWithCommentAmount)
    expect(tokenAnalysis).to.equal(tokenAnalysisAmount)
  })

  it('setActionPrice() - Owner of contract should be able to update action price', async function () {
    const { owner, processorContract } = await loadFixture(deployXRequestProcessorFixture)

    const addend = ethers.parseEther('5000')
    for (let keyName in XActionType) {
      const enumValue = XActionType[keyName]
      const currentActionPrice = await processorContract.getActionPrice(enumValue)
      const newActionPrice = currentActionPrice + addend

      await expect(processorContract.connect(owner).setActionPrice(enumValue, newActionPrice)).not
        .to.be.reverted

      const updatedActionPrice = await processorContract.getActionPrice(enumValue)
      await expect(updatedActionPrice).to.not.equal(currentActionPrice)
    }
  })

  it('setActionPrice() - Regular user should NOT be able to update action price', async function () {
    const { user1, processorContract } = await loadFixture(deployXRequestProcessorFixture)

    const newPrice = 0n
    await expect(
      processorContract.connect(user1).setActionPrice(XActionType.TokenAnalysis, newPrice)
    ).to.be.revertedWithCustomError(processorContract, 'OwnableUnauthorizedAccount')
  })

  it('setActionPrice() - Should throw on out-of-bounds XActionType enum value', async function () {
    const { owner, processorContract } = await loadFixture(deployXRequestProcessorFixture)

    const invalidEnumValue = 100
    const newPrice = 0n
    await expect(processorContract.connect(owner).setActionPrice(invalidEnumValue, newPrice)).to.be
      .reverted
  })

  it('getActionPriceAll() - Should retrieve all action prices', async function () {
    const { processorContract } = await loadFixture(deployXRequestProcessorFixture)

    const [like, reply, replyToThread, repost, repostWithComment, tokenAnalysis] =
      await processorContract.getActionPriceAll()

    expect(like).to.equal(likeAmount)
    expect(reply).to.equal(replyAmount)
    expect(replyToThread).to.equal(replyToThreadAmount)
    expect(repost).to.equal(repostAmount)
    expect(repostWithComment).to.equal(repostWithCommentAmount)
    expect(tokenAnalysis).to.equal(tokenAnalysisAmount)
  })

  it('setActionPriceAll() - Owner of contract should be able to update all action prices', async function () {
    const { owner, processorContract } = await loadFixture(deployXRequestProcessorFixture)

    const addend = ethers.parseEther('5000')

    const newLike = likeAmount + addend
    const newReply = replyAmount + addend
    const newReplyToThread = replyToThreadAmount + addend
    const newRepost = repostAmount + addend
    const newRepostWithComment = repostWithCommentAmount + addend
    const newTokenAnalysis = tokenAnalysisAmount + addend

    await expect(
      processorContract
        .connect(owner)
        .setActionPriceAll(
          newLike,
          newReply,
          newReplyToThread,
          newRepost,
          newRepostWithComment,
          newTokenAnalysis
        )
    ).not.to.be.reverted

    const [like, reply, replyToThread, repost, repostWithComment, tokenAnalysis] =
      await processorContract.getActionPriceAll()

    expect(like).to.equal(newLike)
    expect(reply).to.equal(newReply)
    expect(replyToThread).to.equal(newReplyToThread)
    expect(repost).to.equal(newRepost)
    expect(repostWithComment).to.equal(newRepostWithComment)
    expect(tokenAnalysis).to.equal(newTokenAnalysis)
  })

  it('setActionPriceAll() - Regular user should NOT be able to update all action prices', async function () {
    const { user1, processorContract } = await loadFixture(deployXRequestProcessorFixture)

    await expect(
      processorContract.connect(user1).setActionPriceAll(0n, 0n, 0n, 0n, 0n, 0n)
    ).to.be.revertedWithCustomError(processorContract, 'OwnableUnauthorizedAccount')
  })

  it('interactWithPost() - User should be able to invoke actions on X posts', async function () {
    const { owner, user1, processorContract, tokenContract } = await loadFixture(
      deployXRequestProcessorFixture
    )

    await tokenContract.connect(owner).transfer(user1.address, repostAmount)
    const processorContractAddress = await processorContract.getAddress()
    await tokenContract.connect(user1).approve(processorContractAddress, repostAmount)

    const userBalanceBefore = await tokenContract.balanceOf(user1.address)
    expect(userBalanceBefore).to.equal(repostAmount)

    const xPostUri = 'https://x.com/SpaceX/status/1928107204931940365'
    await expect(
      processorContract.connect(user1).interactWithPost(XActionType.Repost, xPostUri)
    ).to.emit(processorContract, 'NewPostInteraction')

    const userBalanceAfter = await tokenContract.balanceOf(user1.address)
    expect(userBalanceAfter).to.equal(0n)

    const burnPercent = await processorContract.getBurnPercentage()
    const [paymentAmount, burnAmount] = applyBurnPercentage(repostAmount, burnPercent)

    const processorContractBalance = await tokenContract.balanceOf(processorContractAddress)
    expect(processorContractBalance).to.equal(paymentAmount)

    const deadAddressBalance = await tokenContract.balanceOf(await processorContract.DEAD_ADDRESS())
    expect(deadAddressBalance).to.equal(burnAmount)
  })

  it('interactWithPost() - User should be able to invoke XActionType.TokenAnalysis actions', async function () {
    const { owner, user1, processorContract, tokenContract } = await loadFixture(
      deployXRequestProcessorFixture
    )

    await tokenContract.connect(owner).transfer(user1.address, tokenAnalysisAmount)
    const processorContractAddress = await processorContract.getAddress()
    await tokenContract.connect(user1).approve(processorContractAddress, tokenAnalysisAmount)

    const userBalanceBefore = await tokenContract.balanceOf(user1.address)
    expect(userBalanceBefore).to.equal(tokenAnalysisAmount)

    const ticker = 'GIANTAI'
    await expect(
      processorContract.connect(user1).interactWithPost(XActionType.TokenAnalysis, ticker)
    ).not.to.be.reverted
  })

  it('interactWithPost() - User should NOT be able to invoke XActionType.TokenAnalysis with invalid TICKER', async function () {
    const { owner, user1, processorContract, tokenContract } = await loadFixture(
      deployXRequestProcessorFixture
    )

    await tokenContract.connect(owner).transfer(user1.address, tokenAnalysisAmount)
    const processorContractAddress = await processorContract.getAddress()
    await tokenContract.connect(user1).approve(processorContractAddress, tokenAnalysisAmount)

    const userBalanceBefore = await tokenContract.balanceOf(user1.address)
    expect(userBalanceBefore).to.equal(tokenAnalysisAmount)

    const ticker = 'SUPER_LONG_AND_INVALID_TICKER_NAME'
    await expect(
      processorContract.connect(user1).interactWithPost(XActionType.TokenAnalysis, ticker)
    ).to.be.reverted
  })

  it('interactWithPost() - User should NOT be able to invoke actions with empty URI or TICKER', async function () {
    const { owner, user1, processorContract, tokenContract } = await loadFixture(
      deployXRequestProcessorFixture
    )

    await tokenContract.connect(owner).transfer(user1.address, tokenAnalysisAmount)
    const processorContractAddress = await processorContract.getAddress()
    await tokenContract.connect(user1).approve(processorContractAddress, tokenAnalysisAmount)

    const userBalanceBefore = await tokenContract.balanceOf(user1.address)
    expect(userBalanceBefore).to.equal(tokenAnalysisAmount)

    const xPostUri = ''
    await expect(
      processorContract.connect(user1).interactWithPost(XActionType.TokenAnalysis, xPostUri)
    ).to.be.reverted
  })

  it('interactWithPost() - User should NOT be able to invoke actions without ERC20 balance', async function () {
    const { user1, processorContract, tokenContract } = await loadFixture(
      deployXRequestProcessorFixture
    )

    const spender = await processorContract.getAddress()
    await tokenContract.connect(user1).approve(spender, likeAmount)

    const userBalance = await tokenContract.balanceOf(user1.address)
    expect(userBalance).to.equal(0n)

    const xPostUri = 'https://x.com/SpaceX/status/1928107204931940365'
    await expect(
      processorContract.connect(user1).interactWithPost(XActionType.Like, xPostUri)
    ).to.be.revertedWithCustomError(tokenContract, 'ERC20InsufficientBalance')
  })

  it('getPaymentTokenAddress() - Should return the ERC20 address set during deploy time', async function () {
    const { processorContract, tokenContract } = await loadFixture(deployXRequestProcessorFixture)

    const deployTimeTokenAddress = await tokenContract.getAddress()
    const processorContractTokenAddress = await processorContract.getPaymentTokenAddress()

    expect(processorContractTokenAddress).to.equal(deployTimeTokenAddress)
  })

  it('setPaymentTokenAddress() - Owner should be able to change ERC20 payment token', async function () {
    const { owner, processorContract, tokenContract } = await loadFixture(
      deployXRequestProcessorFixture
    )

    const deployTimeTokenAddress = await tokenContract.getAddress()
    const processorContractTokenAddress = await processorContract.getPaymentTokenAddress()
    expect(deployTimeTokenAddress).to.equal(processorContractTokenAddress)

    const tokenFactory = await ethers.getContractFactory('StandardERC20', owner)
    const newTokenContract = await tokenFactory
      .connect(owner)
      .deploy('Mega AI', 'MAI', ethers.parseEther('1000000'))
    const newTokenAddress = await newTokenContract.getAddress()

    await expect(processorContract.connect(owner).setPaymentTokenAddress(newTokenAddress)).not.to.be
      .reverted

    const newProcessorContractTokenAddress = await processorContract.getPaymentTokenAddress()
    expect(newProcessorContractTokenAddress).to.equal(newTokenAddress)
  })

  it('setPaymentTokenAddress() - Regular user should NOT be able to change ERC20 payment token', async function () {
    const { user1, processorContract } = await loadFixture(deployXRequestProcessorFixture)

    const tokenFactory = await ethers.getContractFactory('StandardERC20', user1)
    const userTokenContract = await tokenFactory
      .connect(user1)
      .deploy('My AI', 'MAI', ethers.parseEther('1000000'))
    const userTokenAddress = await userTokenContract.getAddress()

    await expect(processorContract.connect(user1).setPaymentTokenAddress(userTokenAddress)).to.be
      .reverted
  })

  it('setPaymentTokenAddress() - Should NOT accept setting to zero address', async function () {
    const { owner, processorContract } = await loadFixture(deployXRequestProcessorFixture)

    await expect(processorContract.connect(owner).setPaymentTokenAddress(ethers.ZeroAddress)).to.be
      .reverted
  })

  it('setBurnPercentage() - Regular user should NOT be able to change the burn percentage', async function () {
    const { user1, processorContract } = await loadFixture(deployXRequestProcessorFixture)

    const newBurnPercent = 0n
    await expect(processorContract.connect(user1).setBurnPercentage(newBurnPercent)).to.be.reverted
  })

  it('setBurnPercentage() - Owner should be able to change the burn percentage between 0-100', async function () {
    const { owner, processorContract } = await loadFixture(deployXRequestProcessorFixture)

    const validPercentages = [0n, 15n, 25n, 50n, 80n, 100n]
    for (let percent of validPercentages) {
      await expect(processorContract.connect(owner).setBurnPercentage(percent)).not.to.be.reverted
      expect(await processorContract.getBurnPercentage(), percent)
    }

    const invalidPercentages = [101n, 150n, 200n]
    for (let percent of invalidPercentages) {
      await expect(processorContract.connect(owner).setBurnPercentage(percent)).to.be.reverted
    }
  })

  it('withdrawFunds() - Owner should be able to withdraw funds to a new address', async function () {
    const { owner, processorContract, tokenContract } = await loadFixture(
      deployXRequestProcessorFixture
    )

    // Add tokens to the contract
    const processorContractAddress = await processorContract.getAddress()
    await tokenContract.connect(owner).approve(processorContractAddress, replyToThreadAmount)
    const xPostUri = 'https://x.com/SpaceX/status/1928107204931940365'
    await processorContract.connect(owner).interactWithPost(XActionType.ReplyToThread, xPostUri)
    const processorContractBalance = await tokenContract.balanceOf(processorContractAddress)

    const otherWallet = ethers.Wallet.createRandom()
    await expect(processorContract.connect(owner).withdrawFunds(otherWallet.address)).not.to.be
      .reverted

    const otherWalletBalance = await tokenContract.balanceOf(otherWallet.address)
    expect(otherWalletBalance).to.equal(processorContractBalance)
  })

  it('withdrawFunds() - Regular user should NOT be able to withdraw funds', async function () {
    const { user1, processorContract } = await loadFixture(deployXRequestProcessorFixture)

    await expect(
      processorContract.connect(user1).withdrawFunds(user1.address)
    ).to.be.revertedWithCustomError(processorContract, 'OwnableUnauthorizedAccount')
  })
})
