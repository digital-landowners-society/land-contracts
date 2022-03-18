const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { BigNumber } = require("ethers");

const deployLandDao = async () => {
  const landDaoFactory = await ethers.getContractFactory("LandDAO");
  const landDao = await landDaoFactory.deploy(
      "LandDAO",
      "LAND",
      "0x0000000000000000000000000000000000000000"
  );
  await landDao.deployed();
  return landDao;
};

const getTeam = async (landDao) => {
  const factory = await ethers.getContractFactory("TeamManager");
  const teamManager = await factory.deploy(landDao.address);
  await teamManager.deployed();
  await landDao.sendTokens("team", teamManager.address);
  return teamManager;
};

describe("LandDAO Distribute to Team", function () {
  it("Should throw exception when Team address not set", async function () {
    const landDao = await deployLandDao();
    const teamManager = await getTeam(landDao);
    await expect(teamManager.distributeTeam(1)).to.be.revertedWith(
      "Team address not set"
    );
  });

  it("Should throw exception when Team amount exceeds supply", async function () {
    const landDao = await deployLandDao();
    const teamManager = await getTeam(landDao);
    const [owner] = await ethers.getSigners();
    await teamManager.setTeamWallet(owner.address);
    await expect(
      teamManager.distributeTeam(BigNumber.from(10).pow(27))
    ).to.be.revertedWith("Amount exceeds supply");
  });

  it("Should throw exception when Team amount more than releasable", async function () {
    const landDao = await deployLandDao();
    const teamManager = await getTeam(landDao);
    const [owner] = await ethers.getSigners();
    await teamManager.setTeamWallet(owner.address);
    await expect(teamManager.distributeTeam(1)).to.be.revertedWith(
      "Amount more than releasable"
    );
  });

  it("Should release", async function () {
    const landDao = await deployLandDao();
    const teamManager = await getTeam(landDao);
    const [owner] = await ethers.getSigners();
    await teamManager.setTeamWallet(owner.address);
    const nextDate = 3600 * 24 * 100;
    await network.provider.send("evm_increaseTime", [nextDate]);
    await network.provider.send("evm_mine");
    await teamManager.distributeTeam(1);
    const balance = await landDao.balanceOf(owner.address);
    expect(balance).to.equal(1);
  });

  it("Should release max", async function () {
    const landDao = await deployLandDao();
    const teamManager = await getTeam(landDao);
    const [owner] = await ethers.getSigners();
    await teamManager.setTeamWallet(owner.address);
    const nextDate = 3600 * 24 * 720;
    await network.provider.send("evm_increaseTime", [nextDate]);
    await network.provider.send("evm_mine");
    const maxSupply = BigNumber.from(10).pow(18).mul(120_000_000);
    await teamManager.distributeTeam(maxSupply);
    const balance = await landDao.balanceOf(owner.address);
    expect(balance).to.equal(maxSupply);
  });

  it("Should not release more", async function () {
    const landDao = await deployLandDao();
    const teamManager = await getTeam(landDao);
    const [owner] = await ethers.getSigners();
    await teamManager.setTeamWallet(owner.address);
    const nextDay = 3600 * 24;
    const nextDate = nextDay * 91;
    await network.provider.send("evm_increaseTime", [nextDate]);
    await network.provider.send("evm_mine");
    const oneDayAmount = BigNumber.from(10).pow(18).mul(190476);
    await teamManager.distributeTeam(oneDayAmount);
    const balance = await landDao.balanceOf(owner.address);
    expect(balance).to.equal(oneDayAmount);
    await expect(teamManager.distributeTeam(oneDayAmount)).to.be.revertedWith(
      "Amount more than releasable"
    );
    await network.provider.send("evm_increaseTime", [nextDay]);
    await network.provider.send("evm_mine");
    await teamManager.distributeTeam(oneDayAmount);
    const balance2 = await landDao.balanceOf(owner.address);
    expect(balance2).to.equal(oneDayAmount.mul(2));
    await expect(teamManager.distributeTeam(oneDayAmount)).to.be.revertedWith(
      "Amount more than releasable"
    );
  });
});
