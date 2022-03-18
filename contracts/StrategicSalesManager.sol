// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/finance/VestingWallet.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StrategicSalesManager is Ownable {

    uint256 public startDate;
    IERC20 public landDao;
    mapping(address=>VestingWallet[]) strategicSaleVestingMap;
    address public investmentWallet;
    uint256 investments;
    bool public investmentWalletFrozen = false;

    event StrategicSaleReleased(address sender, address beneficiary, uint256 amount);
    event StrategicSaleVesting(address beneficiary, uint256 amount, uint64 startTimestamp, uint64 durationSeconds);
    event Received(address, uint256);
    event Invested(address, uint256);
    event InvestmentWithdrawn(address investmentWallet, uint256 amount);
    event InvestmentWalletSet(address investmentWallet);
    event InvestmentWalletFrozen();

    constructor(address landDaoAddress) Ownable() {
        landDao = IERC20(landDaoAddress);
        startDate = block.timestamp;
    }

    // Strategic Sale
    function doStrategicSaleVesting(address beneficiary, uint256 amount, uint64 startTimestamp, uint64 durationSeconds) public onlyOwner {
        require(beneficiary != address(0));
        require(amount <= landDao.balanceOf(address(this)));
        require(startTimestamp > startDate);
        VestingWallet vestingWallet = new VestingWallet(beneficiary, startTimestamp, durationSeconds);
        strategicSaleVestingMap[beneficiary].push(vestingWallet);
        landDao.transfer(address(vestingWallet), amount);
        emit StrategicSaleVesting(beneficiary, amount, startTimestamp, durationSeconds);
    }

    function doStrategicSaleDirect(address beneficiary, uint256 amount) public onlyOwner {
        require(beneficiary != address(0));
        require(amount <= landDao.balanceOf(address(this)));
        landDao.transfer(beneficiary, amount);
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
        emit Received(msg.sender, msg.value);
    }

    function invest() external payable {
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
        require(payable(investmentWallet).send(amount));
        emit InvestmentWithdrawn(investmentWallet, amount);
    }
}
