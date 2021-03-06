// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./LandDAOVesting.sol";

contract TreasuryManager is Ownable {

    IERC20 public landDao;
    uint256 public startDate;
    address public treasuryWallet;
    bool public treasuryFrozen = false;
    uint256 public treasurySupply = 100_000_000e18;
    uint256 public treasuryReleased;

    constructor(address landDaoAddress) Ownable() {
        landDao = IERC20(landDaoAddress);
        startDate = block.timestamp;
    }

    receive() external payable {
    }

    function freezeTreasury() external onlyOwner {
        require(treasuryWallet != address(0), "TreasuryManager: wallet address is not set");
        treasuryFrozen = true;
    }

    function treasuryReleasableAmount() public view returns (uint256) {
        return LandDAOVesting.vestingSchedule(treasurySupply, startDate, block.timestamp) - treasuryReleased;
    }

    function setTreasury(address treasuryWalletAddress) external onlyOwner {
        require(!treasuryFrozen, "TreasuryManager: wallet address is mandatory");
        treasuryWallet = treasuryWalletAddress;
    }

    function distributeTreasury(uint256 amount) external onlyOwner {
        require(treasuryWallet != address(0), "TreasuryManager: treasury address not set");
        require(treasuryReleasableAmount() >= amount, "TreasuryManager: amount more than releasable");
        landDao.transfer(treasuryWallet, amount);
        treasuryReleased += amount;
    }

    function distributeTreasuryEthereum(uint256 amount) external onlyOwner {
        require(treasuryWallet != address(0), "TreasuryManager: treasury address not set");
        require(payable(treasuryWallet).send(amount));
    }
}
