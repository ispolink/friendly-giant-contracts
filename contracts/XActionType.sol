// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/**
 * @dev All possible XActionTypes.
 * Note: the values of Enum are represented as integers starting from 0 for the first value, 1 for the second, and so on
 */
enum XActionType {
  Like,
  Reply,
  ReplyToThread,
  Repost,
  RepostWithComment,
  TokenAnalysis
}
