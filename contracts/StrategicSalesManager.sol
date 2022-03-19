// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/finance/VestingWallet.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StrategicSalesManager is Ownable {

    uint256 public startDate;
    IERC20 public landDao;
    mapping(address=>VestingWallet[]) strategicSaleVestingMap;

    constructor(address landDaoAddress) Ownable() {
        landDao = IERC20(landDaoAddress);
        startDate = block.timestamp;
    }

    // Strategic Sale
    function saleVesting(address beneficiary, uint256 amount, uint64 startAfterSeconds, uint64 durationSeconds)
    external
    onlyOwner {
        require(beneficiary != address(0), "StrategicSalesManager: beneficiary should be provided");
        uint64 startTimestamp = uint64(block.timestamp) + startAfterSeconds;
        VestingWallet vestingWallet = new VestingWallet(beneficiary, startTimestamp, durationSeconds);
        strategicSaleVestingMap[beneficiary].push(vestingWallet);
        landDao.transfer(address(vestingWallet), amount);
    }

    function saleDirect(address beneficiary, uint256 amount) external onlyOwner {
        require(beneficiary != address(0), "StrategicSalesManager: beneficiary should be provided");
        landDao.transfer(beneficiary, amount);
    }

    function saleReleaseOwner(address beneficiary) external onlyOwner {
        strategicSaleRelease(beneficiary);
    }

    function saleRelease() external {
        strategicSaleRelease(msg.sender);
    }

    function strategicSaleRelease(address beneficiary) internal {
        VestingWallet[] memory vestingWallets = strategicSaleVestingMap[beneficiary];
        require(vestingWallets.length > 0, "StrategicSalesManager: not eligible");
        for (uint256 i=0; i<vestingWallets.length; i++) {
            vestingWallets[i].release(address(landDao));
        }
    }

    // Payments
    receive() external payable {
    }

    function investmentWithdraw(address investmentWallet, uint256 amount) external onlyOwner {
        require(payable(investmentWallet).send(amount));
    }
}
