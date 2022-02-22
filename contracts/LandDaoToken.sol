// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

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

contract LandDAO is ERC20Pausable, Ownable {

    // TODO Add support for roles, make pause-able, owner should not manage
    // TODO remove storage vars
    // TODO use useDapp
    // TODO use Mulitcall

    // STORAGE

    // Supplies
    uint256 public landOwnerSupply =           90_000_000e18;
    uint256 public investmentRewardsSupply =  340_000_000e18;
    uint256 public stackingRewardsSupply =    100_000_000e18;
    uint256 public dlsDaoSupply =              90_000_000e18;
    uint256 public dlsNftSupply =              90_000_000e18;
    uint256 public liquidityManagementSupply = 20_000_000e18;
    uint256 public treasurySupply =           100_000_000e18;
    uint256 public teamSupply =               120_000_000e18;
    uint256 public strategicSaleSupply =       50_000_000e18;
    uint256 public startDate;

    // Land Owners
    LandOwnerManager public landOwnerManager;
    DlsNftOwnerManager public dlsNftOwnerManager;
    DlsDaoManager public dlsDaoManager;
    StrategicSalesManager public strategicSalesManager;
    TeamManager public teamManager;
    TreasuryManager public treasuryManager;
    LiquidityManager public liquidityManager;


    // CONSTRUCTOR
    constructor(string memory name_, string memory symbol_, address dlsNftAddress) ERC20(name_, symbol_) Ownable() {
        uint256 _startDate = block.timestamp;
        startDate = _startDate;

        uint256 totalToMinted = investmentRewardsSupply + stackingRewardsSupply;
        landOwnerManager = new LandOwnerManager(msg.sender);
        dlsNftOwnerManager = new DlsNftOwnerManager(dlsNftAddress);
        dlsDaoManager = new DlsDaoManager(msg.sender);
        strategicSalesManager = new StrategicSalesManager(msg.sender);
        teamManager = new TeamManager(msg.sender);
        treasuryManager = new TreasuryManager(msg.sender);
        liquidityManager = new LiquidityManager(msg.sender);
        _mint(address(this), totalToMinted);
        _mint(address(landOwnerManager), landOwnerSupply);
        _mint(address(dlsNftOwnerManager), dlsNftSupply);
        _mint(address(dlsDaoManager), dlsDaoSupply);
        _mint(address(strategicSalesManager), strategicSaleSupply);
        _mint(address(teamManager), teamSupply);
        _mint(address(treasuryManager), treasurySupply);
        _mint(address(liquidityManager), liquidityManagementSupply);
    }

}
