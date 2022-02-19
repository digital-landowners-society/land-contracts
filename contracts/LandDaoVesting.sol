// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

library  LandDaoVesting {
    function vestingSchedule(uint256 _totalAllocation, uint256 _startDate, uint256 _timestamp) internal pure returns (uint256) {
        uint256 start = _startDate + 90 days;
        uint256 duration = 630 days;
        if (_timestamp < start) {
            return 0;
        } else if (_timestamp > start + duration) {
            return _totalAllocation;
        } else {
            return (_totalAllocation * (_timestamp - start)) / duration;
        }
    }
}
