// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/finance/VestingWallet.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StrategicSaleManager is Ownable {

    uint256 public startDate;
    IERC20 public landDao;
    mapping(address=>VestingWallet[]) strategicSaleVestingMap;

    // Strategic Sale
    event StrategicSaleReleased(address sender, address beneficiary, uint256 amount);
    event StrategicSaleVesting(address beneficiary, uint256 amount, uint64 startTimestamp, uint64 durationSeconds);

    constructor(address landDaoOwner){
        landDao = IERC20(msg.sender);
        startDate = block.timestamp;
        _transferOwnership(landDaoOwner);
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
}
