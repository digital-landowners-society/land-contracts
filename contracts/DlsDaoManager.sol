// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./LandDaoVesting.sol";

contract DlsDaoManager is Ownable {

    uint256 public startDate;
    IERC20 public landDao;
    IERC20 public dlsDao;
    uint256 public dlsDaoSupply = 90_000_000e18;
    bool public dlsDaoFrozen = false;


    // DlsDao
    event DlsDaoDistributed(address dlsDao, uint256 amount);
    event DlsDaoSet(address dlsDao);
    event DlsDaoFrozen();

    constructor(address landDaoOwner) {
        landDao = IERC20(msg.sender);
        startDate = block.timestamp;
        _transferOwnership(landDaoOwner);
    }

    // DLS DAO Logic
    function freezeDlsDao() external onlyOwner {
        require(address(dlsDao) != address(0));
        dlsDaoFrozen = true;
        emit DlsDaoFrozen();
    }

    function dlsDaoReleasableAmount() public view returns (uint256) {
        return LandDaoVesting.vestingSchedule(dlsDaoSupply, startDate, block.timestamp) - (dlsDaoSupply - landDao.balanceOf(address(this)));
    }

    function setDlsDao(address dlsDaoAddress) external onlyOwner {
        require(!dlsDaoFrozen);
        dlsDao = IERC20(dlsDaoAddress);
        emit DlsDaoSet(dlsDaoAddress);
    }

    function distributeToDlsDao(uint256 amount) external {
        require(address(dlsDao) != address(0), "DLS DAO address not set");
        require(amount <= landDao.balanceOf(address(this)), "Amount exceeds supply");
        require(dlsDaoReleasableAmount() >= amount, "Amount more than releasable");
        landDao.transfer(address(dlsDao), amount);
        emit DlsDaoDistributed(address(dlsDao), amount);
    }
}
