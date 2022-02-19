const {expect} = require("chai");
const {ethers, network} = require("hardhat");
const {BigNumber} = require("ethers");

describe("LandDAO Distribute to DLS DAO", function () {
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

  it("Should throw exception when DLS DAO amount exceeds supply", async function () {
    const LandDAO = await ethers.getContractFactory("LandDAO");
    const landDAO = await LandDAO.deploy(
      "LandDAO",
      "LAND",
      "0x3f33eea734b01ec9e9bd1b44a3eb80c36ba585be"
    );
    await landDAO.deployed();
    const [owner] = await ethers.getSigners();
    await landDAO.setDlsDao(owner.address);
    await expect(
      landDAO.distributeToDlsDao(BigNumber.from(10).pow(27))
    ).to.be.revertedWith("Amount exceeds supply");
  });

  it("Should throw exception when DLS DAO amount more than releasable", async function () {
    const LandDAO = await ethers.getContractFactory("LandDAO");
    const landDAO = await LandDAO.deploy(
      "LandDAO",
      "LAND",
      "0x3f33eea734b01ec9e9bd1b44a3eb80c36ba585be"
    );
    await landDAO.deployed();
    const [owner] = await ethers.getSigners();
    await landDAO.setDlsDao(owner.address);
    await expect(landDAO.distributeToDlsDao(1)).to.be.revertedWith(
      "Amount more than releasable"
    );
  });

  it("Should release", async function () {
    const LandDAO = await ethers.getContractFactory("LandDAO");
    const landDAO = await LandDAO.deploy(
      "LandDAO",
      "LAND",
      "0x3f33eea734b01ec9e9bd1b44a3eb80c36ba585be"
    );
    await landDAO.deployed();
    const [owner] = await ethers.getSigners();
    await landDAO.setDlsDao(owner.address);
    const nextDate = 3600 * 24 * 100;
    await network.provider.send("evm_increaseTime", [nextDate]);
    await network.provider.send("evm_mine");
    await landDAO.distributeToDlsDao(1);
    expect(await landDAO.balanceOf(owner.address)).to.equal(1);
  });
});
