const { expect } = require("chai");
const { ethers } = require("hardhat");
const {BigNumber} = require("ethers");

describe("LandDAO", function () {
  it("Should return the total supply", async function () {
    const LandDAO = await ethers.getContractFactory("LandDAO");
    const landDAO = await LandDAO.deploy(
      "LandDAO",
      "LAND",
      "0x3f33eea734b01ec9e9bd1b44a3eb80c36ba585be"
    );
    await landDAO.deployed();
    const totalSupply = await landDAO.totalSupply();
    const expectedTotalSupply = BigNumber.from(10).pow(27);
    expect(totalSupply).to.equal(expectedTotalSupply);
  });
});
