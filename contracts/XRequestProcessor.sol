// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';
import {SafeERC20} from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

import {XActionType} from './XActionType.sol';

contract XRequestProcessor is Ownable {
  IERC20 private _paymentToken;

  mapping(XActionType => uint256) private _actionAmounts;

  constructor(address paymentToken) Ownable(msg.sender) {
    _paymentToken = IERC20(paymentToken);
  }

  modifier nonZeroAddress(address account) {
    require(account != address(0), 'Zero address not allowed');
    _;
  }

  event NewPostInteraction(
    address indexed payer,
    XActionType indexed actionType,
    uint128 indexed unixDay,
    string uriOrTicker
  );
  event PaymentTokenChanged(address newToken);

  /**
   * @dev Returns the required token amount that is set for the given XActionType
   * @param actionType A value from XActionType enum
   */
  function getActionPrice(XActionType actionType) public view returns (uint256) {
    return _actionAmounts[actionType];
  }

  /**
   * @dev Modify the required token amount for X (Twitter) post interaction for the given XActionType
   * @param actionType The XActionType that we want to modify the price
   * @param tokenAmount New required token amount for the given XActionType
   */
  function setActionPrice(XActionType actionType, uint256 tokenAmount) public onlyOwner {
    // Check if the provided actionType value is within the Enum bounds
    require(uint8(actionType) <= uint8(XActionType.TokenAnalysis), 'Invalid XActionType value');
    _actionAmounts[actionType] = tokenAmount;
  }

  /**
   * @dev Returns all required token amounts that are set for all XActionTypes
   */
  function getActionPriceAll()
    public
    view
    returns (
      uint256 likeAmount,
      uint256 replyAmount,
      uint256 replyToThreadAmount,
      uint256 repostAmount,
      uint256 repostWithCommentAmount,
      uint256 tokenAnalysisAmount
    )
  {
    likeAmount = _actionAmounts[XActionType.Like];
    replyAmount = _actionAmounts[XActionType.Reply];
    replyToThreadAmount = _actionAmounts[XActionType.ReplyToThread];
    repostAmount = _actionAmounts[XActionType.Repost];
    repostWithCommentAmount = _actionAmounts[XActionType.RepostWithComment];
    tokenAnalysisAmount = _actionAmounts[XActionType.TokenAnalysis];
  }

  /**
   * @dev Update all required action amounts for X (Twitter) post interactions
   * @param likeAmount New required token amount
   * @param replyAmount New required token amount
   * @param replyToThreadAmount New required token amount
   * @param repostAmount New required token amount
   * @param repostWithCommentAmount New required token amount
   * @param tokenAnalysisAmount New required token amount
   */
  function setActionPriceAll(
    uint256 likeAmount,
    uint256 replyAmount,
    uint256 replyToThreadAmount,
    uint256 repostAmount,
    uint256 repostWithCommentAmount,
    uint256 tokenAnalysisAmount
  ) public onlyOwner {
    _actionAmounts[XActionType.Like] = likeAmount;
    _actionAmounts[XActionType.Reply] = replyAmount;
    _actionAmounts[XActionType.ReplyToThread] = replyToThreadAmount;
    _actionAmounts[XActionType.Repost] = repostAmount;
    _actionAmounts[XActionType.RepostWithComment] = repostWithCommentAmount;
    _actionAmounts[XActionType.TokenAnalysis] = tokenAnalysisAmount;
  }

  /**
   * @dev This function allows users to perform XActionType for the given postUri on X (Twitter) or $TICKER
   * @param actionType A value from XActionType enum
   * @param uriOrTicker A URI to a post in X (Twitter) or a token $TICKER
   */
  function interactWithPost(XActionType actionType, string memory uriOrTicker) public {
    require(bytes(uriOrTicker).length > 0, 'URI or TICKER cannot be empty');

    if (actionType == XActionType.TokenAnalysis) {
      require(bytes(uriOrTicker).length <= 20, 'Invalid token ticker');
    }

    uint256 paymentAmount = getActionPrice(actionType);

    // Safely transfer the required token amount from the user to this contract
    SafeERC20.safeTransferFrom(_paymentToken, msg.sender, address(this), paymentAmount);

    // Get the current day since the Unix epoch, by dividing by 24 hours (in seconds)
    uint128 unixDay = uint128(block.timestamp / 86400);

    emit NewPostInteraction(msg.sender, actionType, unixDay, uriOrTicker);
  }

  /**
   * @dev Retrieve the underlying payment token address
   */
  function getPaymentTokenAddress() public view returns (address) {
    return address(_paymentToken);
  }

  /**
   * @dev Changes the underlying payment token address
   * @param newToken ERC20 token contract address
   */
  function setPaymentTokenAddress(address newToken) public onlyOwner nonZeroAddress(newToken) {
    _paymentToken = IERC20(newToken);
    emit PaymentTokenChanged(newToken);
  }

  /**
   * @dev Withdraw all tokens from the contract to the specified address
   * @param to Address to receive the tokens held by the contract
   */
  function withdrawFunds(address to) public onlyOwner {
    // Get the balance of the token held by the contract
    uint256 withdrawAmount = _paymentToken.balanceOf(address(this));

    SafeERC20.safeTransfer(_paymentToken, to, withdrawAmount);
  }
}
