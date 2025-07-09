// SPDX-License-Identifier: MIT

pragma solidity ^0.8.27;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';

/**
 * @dev Allows the owner of the token contract extending MisfundRecovery
 * to recover any ERC20 and ERC721 sent mistakenly to the token contract address.
 *
 * Taken from TBTC:
 * https://etherscan.io/address/0x18084fba666a33d37592fa2633fd49a74dd93a88#code#F3#L14
 */
contract MisfundRecovery is Ownable {
  using SafeERC20 for IERC20;

  constructor(address initialOwner) Ownable(initialOwner) {}

  function recoverERC20(IERC20 token, address recipient, uint256 amount) external onlyOwner {
    token.safeTransfer(recipient, amount);
  }

  function recoverERC721(
    IERC721 token,
    address recipient,
    uint256 tokenId,
    bytes calldata data
  ) external onlyOwner {
    token.safeTransferFrom(address(this), recipient, tokenId, data);
  }
}
