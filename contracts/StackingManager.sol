// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./LandDaoVesting.sol";

contract StackingManager is Ownable {

    uint256 public startDate;
    IERC20 public landDao;

    constructor(address landDaoOwner){
        landDao = IERC20(msg.sender);
        startDate = block.timestamp;
        _transferOwnership(landDaoOwner);
    }
}
