/**
 * Taken from: https://docs.ethers.org/v6/migrating/#migrate-utils
 * @param {string} value
 * @returns {string}
 */
function commify(value) {
  const match = value.match(/^(-?)([0-9]*)(\.?)([0-9]*)$/)
  if (!match || (!match[2] && !match[4])) {
    throw new Error(`bad formatted number: ${JSON.stringify(value)}`)
  }

  const neg = match[1]
  const whole = BigInt(match[2] || 0).toLocaleString('en-us')
  const frac = match[4] ? match[4].match(/^(.*?)0*$/)[1] : '0'

  return `${neg}${whole}.${frac}`
}

/**
 * Represent bigint numbers in human-readable form with thousands separator
 * @param {bigint} bigNum
 * @returns {string}
 */
function humanReadableAmount(bigNum) {
  return commify(ethers.formatEther(bigNum)).replace(/\.$/, '').replace(/\.0$/, '')
}

module.exports = { commify, humanReadableAmount }
