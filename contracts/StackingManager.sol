// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StackingManager is Ownable {

    address public singleStackingWallet;
    address public liquidityPoolStackingWallet;
    bool public singleStackingWalletFrozen = false;
    bool public liquidityPoolStackingWalletFrozen = false;
    uint256 public startDate;
    IERC20 public landDao;

    event TokensDistributed(address stackingWallet, uint256 amount);
    event SingleStackingWalletFrozen();
    event SingleStackingWalletSet(address singleStackingWalletAddress);
    event LiquidityPoolStackingWalletFrozen();
    event LiquidityPoolStackingWalletSet(address liquidityPoolStackingWalletAddress);

    constructor(address landDaoOwner){
        landDao = IERC20(msg.sender);
        startDate = block.timestamp;
        _transferOwnership(landDaoOwner);
    }

    function freezeSingleStackingWallet() public onlyOwner {
        require(singleStackingWallet != address(0));
        singleStackingWalletFrozen = true;
        emit SingleStackingWalletFrozen();
    }

    function setSingleStackingWallet(address singleStackingWalletAddress) external onlyOwner {
        require(!singleStackingWalletFrozen, "Single stacking wallet is frozen");
        singleStackingWallet = singleStackingWalletAddress;
        emit SingleStackingWalletSet(singleStackingWalletAddress);
    }


    function distributeSingleStacking(uint256 amount) external onlyOwner {
        require(singleStackingWallet != address(0), "Single stacking address not set");
        require(amount <= landDao.balanceOf(address(this)), "Amount exceeds supply");
        landDao.transfer(singleStackingWallet, amount);
        emit TokensDistributed(singleStackingWallet, amount);
    }


    function freezeLiquidityPoolStackingWallet() public onlyOwner {
        require(liquidityPoolStackingWallet != address(0));
        liquidityPoolStackingWalletFrozen = true;
        emit LiquidityPoolStackingWalletFrozen();
    }

    function setLiquidityPoolStackingWallet(address liquidityPoolStackingWalletAddress) external onlyOwner {
        require(!liquidityPoolStackingWalletFrozen, "Liquidity pool stacking wallet is frozen");
        liquidityPoolStackingWallet = liquidityPoolStackingWalletAddress;
        emit LiquidityPoolStackingWalletSet(liquidityPoolStackingWalletAddress);
    }


    function distributeLiquidityPoolStacking(uint256 amount) external onlyOwner {
        require(liquidityPoolStackingWallet != address(0), "Liquidity pool address not set");
        require(amount <= landDao.balanceOf(address(this)), "Amount exceeds supply");
        landDao.transfer(liquidityPoolStackingWallet, amount);
        emit TokensDistributed(liquidityPoolStackingWallet, amount);
    }
}
