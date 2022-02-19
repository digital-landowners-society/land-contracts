const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LandDAO", function () {
  it("Should throw exception when DLS DAO address not set", async function () {
    const LandDAO = await ethers.getContractFactory("LandDAO");
    const landDAO = await LandDAO.deploy(
      "LandDAO",
      "LAND",
      "0x3f33eea734b01ec9e9bd1b44a3eb80c36ba585be"
    );
    await landDAO.deployed();
    await expect(landDAO.distributeToDlsDao(1)).to.be.revertedWith(
      "DLS DAO address not set"
    );
  });
});
