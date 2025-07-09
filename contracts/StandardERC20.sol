// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.27;

import {ERC20} from '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import {ERC20Burnable} from '@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol';
import {ERC20Permit} from '@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol';

import {MisfundRecovery} from './MisfundRecovery.sol';

contract StandardERC20 is ERC20, ERC20Burnable, ERC20Permit, MisfundRecovery {
  constructor(
    string memory name,
    string memory symbol,
    uint256 initialSupply
  ) ERC20(name, symbol) ERC20Permit(name) MisfundRecovery(msg.sender) {
    _mint(msg.sender, initialSupply);
  }
}
