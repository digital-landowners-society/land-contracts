// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./LandDaoVesting.sol";

contract TreasuryManager is Ownable {

    IERC20 public landDao;
    uint256 public startDate;
    address public treasuryWallet;
    bool public treasuryFrozen = false;
    uint256 public treasurySupply = 100_000_000e18;

    event TreasuryDistributed(address treasury, uint256 amount);
    event TreasuryEthereumDistributed(address treasury, uint256 amount);
    event TreasurySet(address treasury);
    event TreasuryFrozen();
    event Received(address sender, uint256 amount);

    constructor(address landDaoOwner){
        landDao = IERC20(msg.sender);
        _transferOwnership(landDaoOwner);
        startDate = block.timestamp;
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    function freezeTreasury() external onlyOwner {
        require(treasuryWallet != address(0));
        treasuryFrozen = true;
        emit TreasuryFrozen();
    }

    function treasuryReleasableAmount() public view returns (uint256) {
        return LandDaoVesting.vestingSchedule(treasurySupply, startDate, block.timestamp) - (treasurySupply - landDao.balanceOf(address(this)));
    }

    function setTreasury(address treasuryWalletAddress) external onlyOwner {
        require(!treasuryFrozen);
        treasuryWallet = treasuryWalletAddress;
        emit TreasurySet(treasuryWalletAddress);
    }

    function distributeTreasury(uint256 amount) external onlyOwner {
        require(treasuryWallet != address(0), "Treasury address not set");
        require(amount <= landDao.balanceOf(address(this)), "Amount exceeds supply");
        require(treasuryReleasableAmount() >= amount, "Amount more than releasable");
        landDao.transfer(treasuryWallet, amount);
        emit TreasuryDistributed(treasuryWallet, amount);
    }

    function distributeUnclaimedLandOwnerSupply(address landOwnerManagerAddress) external onlyOwner{
        uint256 remainingLandOwnerSupply = landDao.balanceOf(landOwnerManagerAddress);
        require(remainingLandOwnerSupply > 0);
        require(landDao.allowance(landOwnerManagerAddress, address(this)) >= remainingLandOwnerSupply);
        landDao.transferFrom(landOwnerManagerAddress, treasuryWallet, remainingLandOwnerSupply);
        emit TreasuryDistributed(treasuryWallet, remainingLandOwnerSupply);
    }

    function distributeTreasuryEthereum(uint256 amount) external onlyOwner {
        require(treasuryWallet != address(0), "Team address not set");
        require(amount <= address(this).balance, "Amount exceeds balance");
        require(payable(treasuryWallet).send(amount));
        emit TreasuryEthereumDistributed(treasuryWallet, amount);
    }
}
