// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./LandDaoVesting.sol";

contract TreasuryManager is Ownable {

    IERC20 public landDao;
    uint256 public startDate;
    address public treasury;
    bool public treasuryFrozen = false;
    uint256 public treasurySupply = 100_000_000e18;

    event TreasuryDistributed(address treasury, uint256 amount);
    event TreasurySet(address treasury);
    event TreasuryFrozen();

    constructor(address landDaoOwner){
        landDao = IERC20(msg.sender);
        _transferOwnership(landDaoOwner);
        startDate = block.timestamp;
    }

    function freezeTreasury() external onlyOwner {
        require(treasury != address(0));
        treasuryFrozen = true;
        emit TreasuryFrozen();
    }

    function treasuryReleasableAmount() public view returns (uint256) {
        return LandDaoVesting.vestingSchedule(treasurySupply, startDate, block.timestamp) - (treasurySupply - landDao.balanceOf(address(this)));
    }

    function setTreasury(address treasuryAddress) external onlyOwner {
        require(!treasuryFrozen);
        treasury = treasuryAddress;
        emit TreasurySet(treasuryAddress);
    }

    function distributeTreasury(uint256 amount) external onlyOwner {
        require(treasury != address(0), "Treasury address not set");
        require(amount <= landDao.balanceOf(address(this)), "Amount exceeds supply");
        require(treasuryReleasableAmount() >= amount, "Amount more than releasable");
        landDao.transfer(treasury, amount);
        emit TreasuryDistributed(treasury, amount);
    }

    function distributeUnclaimedLandOwnerSupply(address landOwnerManagerAddress) external onlyOwner{
        uint256 remainingLandOwnerSupply = landDao.balanceOf(landOwnerManagerAddress);
        require(remainingLandOwnerSupply > 0);
        require(landDao.allowance(landOwnerManagerAddress, address(this)) >= remainingLandOwnerSupply);
        landDao.transferFrom(landOwnerManagerAddress, treasury, remainingLandOwnerSupply);
        emit TreasuryDistributed(treasury, remainingLandOwnerSupply);
    }
}
