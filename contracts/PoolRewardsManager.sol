// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./LandDaoVesting.sol";

contract PoolRewardsManager is Ownable {

    IERC20 public landDao;
    address public poolRewardsWallet;
    bool public poolRewardsWalletFrozen = false;
    uint256 public poolRewardsSupply = 340_000_000e18;
    uint256 public startDate;

    event PoolRewardsDistributed(address poolRewardsWallet,uint amount);
    event PoolRewardsWalletSet(address poolRewardsWallet);
    event PoolRewardsWalletFrozen();

    constructor(address landDaoAddress) Ownable() {
        landDao = IERC20(landDaoAddress);
        startDate = block.timestamp;
    }

    function freezePoolRewardsWallet() public onlyOwner {
        require(poolRewardsWallet != address(0));
        poolRewardsWalletFrozen = true;
        emit PoolRewardsWalletFrozen();
    }

    function setPoolRewardsWallet(address poolRewardsWalletAddress) external onlyOwner {
        require(!poolRewardsWalletFrozen, "Pool rewards wallet is frozen");
        poolRewardsWallet = poolRewardsWalletAddress;
        emit PoolRewardsWalletSet(poolRewardsWallet);
    }

    function poolRewardsReleasableAmount() public view returns (uint256) {
        return LandDaoVesting.vestingSchedule(poolRewardsSupply, startDate, block.timestamp) - (poolRewardsSupply - landDao.balanceOf(address(this)));
    }

    function distributePoolRewards(uint256 amount) external onlyOwner {
        require(poolRewardsWallet != address(0), "Pool rewards wallet address not set");
        require(amount <= landDao.balanceOf(address(this)), "Amount exceeds supply");
        require(poolRewardsReleasableAmount() >= amount, "Amount more than releasable");
        landDao.transfer(poolRewardsWallet, amount);
        emit PoolRewardsDistributed(poolRewardsWallet, amount);
    }
}
