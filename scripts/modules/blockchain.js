const ethers = require('ethers')

const { humanReadableAmount } = require('./utils')

const X_REQUEST_PROCESSOR_ABI =
  require('../../artifacts/contracts/XRequestProcessor.sol/XRequestProcessor.json').abi

/**
 * @param {Interface} cliReader
 * @param {string} actionName
 * @returns {string}
 */
const promptTokenAmount = async (cliReader, actionName) => {
  let amount

  do {
    amount = Number(
      (await cliReader.question(`Enter required action amount for "${actionName}": `)).trim()
    )
  } while (isNaN(amount) || amount <= 0)

  return amount.toString()
}

class RequestActionsDto {
  /**
   * @param {bigint} likeAmount
   * @param {bigint} replyAmount
   * @param {bigint} replyToThreadAmount
   * @param {bigint} repostAmount
   * @param {bigint} repostWithCommentAmount
   * @param {bigint} tokenAnalysisAmount
   */
  constructor(
    likeAmount,
    replyAmount,
    replyToThreadAmount,
    repostAmount,
    repostWithCommentAmount,
    tokenAnalysisAmount
  ) {
    this.likeAmount = likeAmount
    this.replyAmount = replyAmount
    this.replyToThreadAmount = replyToThreadAmount
    this.repostAmount = repostAmount
    this.repostWithCommentAmount = repostWithCommentAmount
    this.tokenAnalysisAmount = tokenAnalysisAmount
  }

  preview() {
    console.log()
    console.log(`Action payment amounts in the current instance:`)
    console.log(`  Like = ${humanReadableAmount(this.likeAmount)} tokens`)
    console.log(`  Reply = ${humanReadableAmount(this.replyAmount)} tokens`)
    console.log(`  ReplyToThread = ${humanReadableAmount(this.replyToThreadAmount)} tokens`)
    console.log(`  Repost = ${humanReadableAmount(this.repostAmount)} tokens`)
    console.log(`  RepostWithComment = ${humanReadableAmount(this.repostWithCommentAmount)} tokens`)
    console.log(`  TokenAnalysis = ${humanReadableAmount(this.tokenAnalysisAmount)} tokens`)
    console.log()
  }
}

/**
 * @param {Interface} CLI user input reader
 * @returns {RequestActionsDto}
 */
async function collectActionAmounts(cliReader) {
  const like = ethers.parseUnits(
    process.env.LIKE_AMOUNT || (await promptTokenAmount(cliReader, 'Like'))
  )
  const reply = ethers.parseUnits(
    process.env.REPLY_AMOUNT || (await promptTokenAmount(cliReader, 'Reply'))
  )
  const replyToThread = ethers.parseUnits(
    process.env.REPLY_TO_THREAD_AMOUNT || (await promptTokenAmount(cliReader, 'ReplyToThread'))
  )
  const repost = ethers.parseUnits(
    process.env.REPOST_AMOUNT || (await promptTokenAmount(cliReader, 'Repost'))
  )
  const repostWithComment = ethers.parseUnits(
    process.env.REPOST_WITH_COMMENT_AMOUNT ||
      (await promptTokenAmount(cliReader, 'RepostWithComment'))
  )
  const tokenAnalysis = ethers.parseUnits(
    process.env.TOKEN_ANALYSIS_AMOUNT || (await promptTokenAmount(cliReader, 'TokenAnalysis'))
  )

  return new RequestActionsDto(like, reply, replyToThread, repost, repostWithComment, tokenAnalysis)
}

/**
 * Publish the specified action amounts to the blockchain
 *
 * @param {RequestActionsDto} actionsDto
 * @param {string} requestProcessorAddress Deployed XRequestProcessor address
 * @param {ethers.Wallet} walletSigner
 * @returns
 */
async function submitActionAmounts(actionsDto, requestProcessorAddress, walletSigner) {
  const contract = new ethers.Contract(
    requestProcessorAddress,
    X_REQUEST_PROCESSOR_ABI,
    walletSigner
  )

  const txData = await contract.setActionPriceAll(
    actionsDto.likeAmount,
    actionsDto.replyAmount,
    actionsDto.replyToThreadAmount,
    actionsDto.repostAmount,
    actionsDto.repostWithCommentAmount,
    actionsDto.tokenAnalysisAmount
  )

  return txData
}

module.exports = { RequestActionsDto, collectActionAmounts, submitActionAmounts }
