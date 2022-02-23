// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/finance/VestingWallet.sol";
import "./LandOwnerManager.sol";
import "./DlsNftOwnerManager.sol";
import "./DlsDaoManager.sol";
import "./StrategicSalesManager.sol";
import "./TeamManager.sol";
import "./TreasuryManager.sol";
import "./LiquidityManager.sol";
import "./PoolRewardsManager.sol";
import "./StackingManager.sol";

contract LandDAO is ERC20Pausable, Ownable {

    // Supplies
    uint256 public landOwnerSupply = 90_000_000e18;
    uint256 public poolRewardsSupply = 340_000_000e18;
    uint256 public stackingRewardsSupply = 100_000_000e18;
    uint256 public dlsDaoSupply = 90_000_000e18;
    uint256 public dlsNftSupply = 90_000_000e18;
    uint256 public liquidityManagementSupply = 20_000_000e18;
    uint256 public treasurySupply = 100_000_000e18;
    uint256 public teamSupply = 120_000_000e18;
    uint256 public strategicSaleSupply = 50_000_000e18;

    // Land Owners
    LandOwnerManager public landOwnerManager;
    DlsNftOwnerManager public dlsNftOwnerManager;
    DlsDaoManager public dlsDaoManager;
    StrategicSalesManager public strategicSalesManager;
    TeamManager public teamManager;
    TreasuryManager public treasuryManager;
    LiquidityManager public liquidityManager;
    PoolRewardsManager public poolRewardsManager;
    StackingManager public stackingManager;

    event Received(address sender, uint256 amount);
    event EthereumDistributed(address sender, uint256 amount);

    // CONSTRUCTOR
    constructor(string memory name_, string memory symbol_, address dlsNftAddress) ERC20(name_, symbol_) Ownable() {
        treasuryManager = new TreasuryManager(msg.sender);
        landOwnerManager = new LandOwnerManager(msg.sender, address(treasuryManager));
        dlsNftOwnerManager = new DlsNftOwnerManager(dlsNftAddress);
        dlsDaoManager = new DlsDaoManager(msg.sender);
        strategicSalesManager = new StrategicSalesManager(msg.sender);
        teamManager = new TeamManager(msg.sender);
        liquidityManager = new LiquidityManager(msg.sender);
        poolRewardsManager = new PoolRewardsManager(msg.sender);
        stackingManager = new StackingManager(msg.sender);
        _mint(address(landOwnerManager), landOwnerSupply);
        _mint(address(dlsNftOwnerManager), dlsNftSupply);
        _mint(address(dlsDaoManager), dlsDaoSupply);
        _mint(address(strategicSalesManager), strategicSaleSupply);
        _mint(address(teamManager), teamSupply);
        _mint(address(treasuryManager), treasurySupply);
        _mint(address(liquidityManager), liquidityManagementSupply);
        _mint(address(poolRewardsManager), poolRewardsSupply);
        _mint(address(stackingManager), stackingRewardsSupply);
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    function distributeTeamEthereum(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Amount exceeds balance");
        require(payable(address(teamManager)).send(amount));
        emit EthereumDistributed(address(teamManager), amount);
    }

    function distributeInvestmentEthereum(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Amount exceeds balance");
        require(payable(address(treasuryManager)).send(amount));
        emit EthereumDistributed(address(treasuryManager), amount);
    }
}
