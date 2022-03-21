// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/governance/TimelockController.sol";

contract LandTimelockController is TimelockController {
    constructor(uint256 minDelay) TimelockController(minDelay, new address[](0), new address[](0)) {

    }

}
