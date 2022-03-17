// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

contract LandDAO is ERC20, ERC20Permit, Ownable {
    mapping(string => uint256) public supplyData;

    // Supplies
    uint256 public landOwnersSupply = 90_000_000e18;
    uint256 public poolRewardsSupply = 340_000_000e18;
    uint256 public stackingRewardsSupply = 100_000_000e18;
    uint256 public dlsDaoSupply = 90_000_000e18;
    uint256 public dlsNftSupply = 90_000_000e18;
    uint256 public liquidityManagementSupply = 20_000_000e18;
    uint256 public treasurySupply = 100_000_000e18;
    uint256 public teamSupply = 120_000_000e18;
    uint256 public strategicSaleSupply = 50_000_000e18;

    // CONSTRUCTOR
    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) ERC20Permit(name_) {
        _mint(address(this), 1e27);
        supplyData["landOwners"] = 90_000_000e18;
        supplyData["poolRewards"] = 340_000_000e18;
        supplyData["singleStackingRewards"] = 30_000_000e18;
        supplyData["liquidityPoolRewards"] = 70_000_000e18;
        supplyData["dlsDao"] = 90_000_000e18;
        supplyData["dlsNft"] = 90_000_000e18;
        supplyData["liquidityManagement"] = 20_000_000e18;
        supplyData["treasury"] = 100_000_000e18;
        supplyData["team"] = 120_000_000e18;
        supplyData["strategicSale"] = 50_000_000e18;
    }

    function sendTokens(string memory supplyName, address contractAddress) public onlyOwner {
        require(contractAddress!=address(0), "LandDao: Should sent to someone");
        uint256 supply = supplyData[supplyName];
        require(supply > 0, "LandDao: not eligible");
        _transfer(address(this), contractAddress, supply);
        supplyData[supplyName] = 0;
    }
}
