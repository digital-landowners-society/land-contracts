const { ethers } = require("hardhat");

describe("LandStacking Deploy", function () {
  it("Should return the total supply", async function () {
    const LandStacking = await ethers.getContractFactory("LandStacking");
    const landStacking = await LandStacking.deploy(
      "LandDAO",
      "LAND",
      "0x0000000000000000000000000000000000000000"
    );
    await landStacking.deployed();
  });
});
