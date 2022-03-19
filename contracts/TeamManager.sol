// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./LandDaoVesting.sol";

contract TeamManager is Ownable {

    IERC20 public landDao;
    address public teamWallet;
    bool public teamWalletFrozen = false;
    uint256 public teamSupply = 120_000_000e18;
    uint256 public teamReleased;
    uint256 public startDate;

    constructor(address landDaoAddress) Ownable() {
        landDao = IERC20(landDaoAddress);
        startDate = block.timestamp;
    }

    receive() external payable {
    }

    function freezeTeamWallet() external onlyOwner {
        require(teamWallet != address(0), "TeamManager: wallet address is mandatory");
        teamWalletFrozen = true;
    }

    function setTeamWallet(address teamWalletAddress) external onlyOwner {
        require(!teamWalletFrozen, "TeamManager: team wallet is frozen");
        teamWallet = teamWalletAddress;
    }

    function teamReleasableAmount() public view returns (uint256) {
        return LandDaoVesting.vestingSchedule(teamSupply, startDate, block.timestamp) - teamReleased;
    }

    function distributeTeam(uint256 amount) external onlyOwner {
        require(teamWallet != address(0), "TeamManager: team address not set");
        require(teamReleasableAmount() >= amount, "TeamManager: amount more than releasable");
        landDao.transfer(teamWallet, amount);
        teamReleased += amount;
    }

    function distributeTeamEthereum(uint256 amount) external onlyOwner {
        require(teamWallet != address(0), "TeamManager: team address not set");
        require(payable(teamWallet).send(amount));
    }
}
