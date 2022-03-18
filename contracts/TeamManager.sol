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
    uint256 public startDate;

    event TeamEthereumDistributed(address teamWallet,uint amount);
    event TeamTokensDistributed(address teamWallet,uint amount);
    event TeamWalletSet(address teamWallet);
    event TeamWalletFrozen();
    event Received(address sender, uint256 amount);

    constructor(address landDaoAddress) Ownable() {
        landDao = IERC20(landDaoAddress);
        startDate = block.timestamp;
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    function freezeTeamWallet() public onlyOwner {
        require(teamWallet != address(0));
        teamWalletFrozen = true;
        emit TeamWalletFrozen();
    }

    function setTeamWallet(address teamWalletAddress) external onlyOwner {
        require(!teamWalletFrozen, "Team wallet is frozen");
        teamWallet = teamWalletAddress;
        emit TeamWalletSet(teamWalletAddress);
    }

    function teamReleasableAmount() public view returns (uint256) {
        return LandDaoVesting.vestingSchedule(teamSupply, startDate, block.timestamp) - (teamSupply - landDao.balanceOf(address(this)));
    }

    function distributeTeam(uint256 amount) external onlyOwner {
        require(teamWallet != address(0), "Team address not set");
        require(amount <= landDao.balanceOf(address(this)), "Amount exceeds supply");
        require(teamReleasableAmount() >= amount, "Amount more than releasable");
        landDao.transfer(teamWallet, amount);
        emit TeamTokensDistributed(teamWallet, amount);
    }

    function distributeTeamEthereum(uint256 amount) external onlyOwner {
        require(teamWallet != address(0), "Team address not set");
        require(amount <= address(this).balance, "Amount exceeds balance");
        require(payable(teamWallet).send(amount));
        emit TeamEthereumDistributed(teamWallet, amount);
    }
}
