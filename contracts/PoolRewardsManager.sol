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
    uint256 public poolRewardsReleased;
    uint256 public startDate;

    constructor(address landDaoAddress) Ownable() {
        landDao = IERC20(landDaoAddress);
        startDate = block.timestamp;
    }

    function freezePoolRewardsWallet() external onlyOwner {
        require(poolRewardsWallet != address(0), "PoolRewardsManager: wallet address is mandatory");
        poolRewardsWalletFrozen = true;
    }

    function setPoolRewardsWallet(address poolRewardsWalletAddress) external onlyOwner {
        require(!poolRewardsWalletFrozen, "PoolRewardsManager: pool rewards wallet is frozen");
        poolRewardsWallet = poolRewardsWalletAddress;
    }

    function poolRewardsReleasableAmount() public view returns (uint256) {
        return LandDaoVesting.vestingSchedule(poolRewardsSupply, startDate, block.timestamp) - poolRewardsReleased;
    }

    function distributePoolRewards(uint256 amount) external onlyOwner {
        require(poolRewardsWallet != address(0), "PoolRewardsManager: pool rewards wallet address not set");
        require(poolRewardsReleasableAmount() >= amount, "PoolRewardsManager: amount more than releasable");
        landDao.transfer(poolRewardsWallet, amount);
        poolRewardsReleased += amount;
    }
}
