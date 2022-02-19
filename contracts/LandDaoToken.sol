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

contract LandDAO is ERC20Pausable, Ownable {

    // TODO Add support for roles, make pause-able, owner should not manage
    // TODO remove storage vars
    // TODO check with Harthat gas reporter
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

    // Treasury Data
    address public treasury;
    bool public treasuryFrozen = false;
    uint256 remainingTreasurySupply = treasurySupply;

    // Strategic Sales Data
    uint256 remainingStrategicSaleSupply = strategicSaleSupply;
    mapping(address=>VestingWallet[]) strategicSaleVestingMap;

    // Investment Data
    address public investmentWallet;
    uint256 investments;
    bool public investmentWalletFrozen = false;

    // Team Data
    uint256 remainingTeamSupply = teamSupply;
    address public teamWallet;
    bool public teamWalletFrozen = false;

    // EVENTS

    // Strategic Sale
    event StrategicSaleReleased(address sender, address beneficiary, uint256 amount);
    event StrategicSaleVesting(address beneficiary, uint256 amount, uint64 startTimestamp, uint64 durationSeconds);

    // Treasury
    event TreasuryDistributed(address treasury, uint256 amount);
    event TreasurySet(address treasury);
    event TreasuryFrozen();

    // Investments
    event Received(address, uint256);
    event Invested(address, uint256);
    event InvestmentWithdrawn(address investmentWallet, uint256 amount);
    event InvestmentWalletSet(address investmentWallet);
    event InvestmentWalletFrozen();

    // Team
    event TeamEthereumDistributed(address teamWallet,uint amount);
    event TeamTokensDistributed(address teamWallet,uint amount);
    event TeamWalletSet(address teamWallet);
    event TeamWalletFrozen();

    // CONSTRUCTOR
    constructor(string memory name_, string memory symbol_, address dlsNftAddress) ERC20(name_, symbol_) Ownable() {
        uint256 _startDate = block.timestamp;
        startDate = _startDate;

        uint256 totalToMinted = investmentRewardsSupply + stackingRewardsSupply + liquidityManagementSupply + treasurySupply + teamSupply + strategicSaleSupply;
        landOwnerManager = new LandOwnerManager(IERC20(this), _startDate);
        dlsNftOwnerManager = new DlsNftOwnerManager(IERC20(this), dlsNftAddress);
        dlsDaoManager = new DlsDaoManager(IERC20(this), msg.sender, _startDate);
        _mint(address(this), totalToMinted);
        _mint(address(landOwnerManager), landOwnerSupply);
        _mint(address(dlsNftOwnerManager), dlsNftSupply);
        _mint(address(dlsDaoManager), dlsDaoSupply);
    }

    // LOGIC

    // Treasury Logic
    function freezeTreasury() external onlyOwner {
        require(treasury != address(0));
        treasuryFrozen = true;
        emit TreasuryFrozen();
    }

    function treasuryReleasableAmount() public view returns (uint256) {
        return _vestingSchedule(treasurySupply) - (treasurySupply - remainingTreasurySupply);
    }

    function setTreasury(address treasuryAddress) external onlyOwner {
        require(!treasuryFrozen);
        treasury = treasuryAddress;
        emit TreasurySet(treasuryAddress);
    }

    function distributeTreasury(uint256 amount) external onlyOwner {
        require(treasury != address(0));
        require(amount <= remainingTreasurySupply);
        require(treasuryReleasableAmount() >= amount);
        _transfer(address(this), treasury, amount);
        remainingTreasurySupply -= amount;
        emit TreasuryDistributed(treasury, amount);
    }

    function distributeUnclaimedLandOwnerSupply() external onlyOwner{
        require(block.timestamp > startDate + 180 days);
        uint256 remainingLandOwnerSupply = balanceOf(address(landOwnerManager));
        _transfer(address(landOwnerManager), treasury, remainingLandOwnerSupply);
        emit TreasuryDistributed(treasury, remainingLandOwnerSupply);
    }

    // Strategic Sale
    function doStrategicSaleVesting(address beneficiary, uint256 amount, uint64 startTimestamp, uint64 durationSeconds) public onlyOwner {
        require(beneficiary != address(0));
        require(amount <= remainingStrategicSaleSupply);
        require(startTimestamp > startDate);
        VestingWallet vestingWallet = new VestingWallet(beneficiary, startTimestamp, durationSeconds);
        strategicSaleVestingMap[beneficiary].push(vestingWallet);
        _transfer(address(this), address(vestingWallet), amount);
        remainingStrategicSaleSupply -= amount;
        emit StrategicSaleVesting(beneficiary, amount, startTimestamp, durationSeconds);
    }

    function doStrategicSaleDirect(address beneficiary, uint256 amount) public onlyOwner {
        require(beneficiary != address(0));
        require(amount <= remainingStrategicSaleSupply);
        _transfer(address(this), beneficiary, amount);
        remainingStrategicSaleSupply -= amount;
        emit StrategicSaleReleased(msg.sender, beneficiary, amount);
    }

    function doStrategicSaleReleaseOwner(address beneficiary) public onlyOwner {
        strategicSaleRelease(beneficiary);
    }

    function doStrategicSaleRelease() public {
        strategicSaleRelease(msg.sender);
    }

    function strategicSaleRelease(address beneficiary) internal {
        VestingWallet[] memory vestingWallets = strategicSaleVestingMap[beneficiary];
        require(vestingWallets.length > 0);
        for (uint256 i=0; i<vestingWallets.length; i++) {
            vestingWallets[i].release(address(this));
        }
        emit StrategicSaleReleased(msg.sender, beneficiary, 0);
    }

    // Payments
    receive() external payable {
        investments += msg.value;
        emit Received(msg.sender, msg.value);
    }

    function freezeInvestmentWallet() public onlyOwner {
        require(investmentWallet != address(0));
        investmentWalletFrozen = true;
        emit InvestmentWalletFrozen();
    }

    function setInvestmentWallet(address investmentWalletAddress) external onlyOwner {
        require(!investmentWalletFrozen);
        investmentWallet = investmentWalletAddress;
        emit InvestmentWalletSet(investmentWalletAddress);
    }

    function investmentWithdraw(uint256 amount) public onlyOwner {
        require(amount <= address(this).balance);
        require(amount <= investments);
        require(payable(investmentWallet).send(amount));
        investments -= amount;
        emit InvestmentWithdrawn(investmentWallet, amount);
    }

    // Team
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
        return _vestingSchedule(teamSupply) - (teamSupply - remainingTeamSupply);
    }

    function distributeTeam(uint256 amount) external onlyOwner {
        require(teamWallet != address(0));
        require(amount <= remainingTeamSupply);
        require(teamReleasableAmount() >= amount);
        _transfer(address(this), teamWallet, amount);
        remainingTeamSupply -= amount;
        emit TeamTokensDistributed(teamWallet, amount);
    }

    function distributeTeamEthereum(uint256 amount) external onlyOwner {
        require(teamWallet != address(0));
        require(amount <= address(this).balance);
        require(payable(teamWallet).send(amount));
        emit TeamEthereumDistributed(teamWallet, amount);
    }

    // Linear Vesting
    function _vestingSchedule(uint256 totalAllocation) internal view returns (uint256) {
        uint256 timestamp = block.timestamp;
        uint256 start = startDate + 90 days;
        uint256 duration = 630 days;
        if (timestamp < start) {
            return 0;
        } else if (timestamp > start + duration) {
            return totalAllocation;
        } else {
            return (totalAllocation * (timestamp - start)) / duration;
        }
    }
}
