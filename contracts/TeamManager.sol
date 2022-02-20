// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

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

    constructor(address landDaoOwner){
        landDao = IERC20(msg.sender);
        _transferOwnership(landDaoOwner);
        startDate = block.timestamp;
    }

    function freezeTeamWallet() public onlyOwner {
        require(teamWallet != address(0));
        teamWalletFrozen = true;
        emit TeamWalletFrozen();
    }

    function setTeamWallet(address teamWalletAddress) external onlyOwner {
        require(!teamWalletFrozen);
        teamWallet = teamWalletAddress;
        emit TeamWalletSet(teamWalletAddress);
    }

    function teamReleasableAmount() public view returns (uint256) {
        return LandDaoVesting.vestingSchedule(teamSupply, startDate, block.timestamp) - (teamSupply - landDao.balanceOf(address(this)));
    }

    function distributeTeam(uint256 amount) external onlyOwner {
        require(teamWallet != address(0));
        require(amount <= landDao.balanceOf(address(this)));
        require(teamReleasableAmount() >= amount);
        landDao.transfer(teamWallet, amount);
        emit TeamTokensDistributed(teamWallet, amount);
    }

    function distributeTeamEthereum(uint256 amount) external onlyOwner {
        require(teamWallet != address(0));
        require(amount <= address(this).balance);
        require(payable(teamWallet).send(amount));
        emit TeamEthereumDistributed(teamWallet, amount);
    }
}