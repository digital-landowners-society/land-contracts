const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");

describe("LandStacking Deploy", function () {
  it("Should return the total supply", async function () {
    const LandStacking = await ethers.getContractFactory("LandStacking");
    const landStacking = await LandStacking.deploy();
    await landStacking.deployed();
  });
});
