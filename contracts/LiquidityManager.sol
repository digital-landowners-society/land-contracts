// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LiquidityManager is Ownable {

    IERC20 public landDao;
    address public liquidityWallet;
    uint256 public liquidityManagementSupply = 20_000_000e18;

    event LiquidityDistributed(address liquidityWallet, uint256 amount);

    constructor(address landDaoOwner){
        landDao = IERC20(msg.sender);
        _transferOwnership(landDaoOwner);
    }

    function distributeToWallet(uint256 amount) external onlyOwner {
        require(liquidityWallet != address(0), "Liquidity wallet address not set");
        require(amount <= landDao.balanceOf(address(this)), "Amount exceeds supply");
        landDao.transfer(liquidityWallet, amount);
        emit LiquidityDistributed(liquidityWallet, amount);
    }

}
