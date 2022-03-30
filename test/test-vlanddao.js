const { expect } = require("chai");
const { ethers } = require("hardhat");

const ether = ethers.utils.parseEther("1");

const deployLandDao = async () => {
  const landDaoFactory = await ethers.getContractFactory("LandDAO");
  const landDao = await landDaoFactory.deploy(
    "LandDAO",
    "LAND",
    "0x0000000000000000000000000000000000000000",
  );
  await landDao.deployed();
  return landDao;
};

const deployVLand = async () => {
  const factory = await ethers.getContractFactory("VLandDAO");
  const contract = await factory.deploy("vLAND Token", "vLAND");
  await contract.deployed();
  return contract;
};

const deployStaking = async (landDao, vLandDao) => {
  const factory = await ethers.getContractFactory("LandStaking");
  const contract = await factory.deploy(landDao.address, vLandDao.address);
  await contract.deployed();
  return contract;
};

describe("VLandDAO Deploy", function () {
  it("Should return the total supply", async function () {
    const vLandDao = await deployVLand();
    expect(await vLandDao.totalSupply()).to.equal(0);
  });

  it("Test set staking", async function () {
    const vLandDao = await deployVLand();
    const [owner] = await ethers.getSigners();
    await vLandDao.setPoolDistributor(owner.address);
  });

  it("Test snapshot", async function () {
    const landDao = await deployLandDao();
    const vLandDao = await deployVLand();
    const staking = await deployStaking(landDao, vLandDao);
    await vLandDao.setStaking(staking.address);

    const [owner] = await ethers.getSigners();
    await landDao.sendTokens("treasury", owner.address);
    await landDao.sendTokens("singleStakingRewards", staking.address);

    const supply = await staking.totalSupply();
    expect(supply).to.equal(0);

    await landDao.approve(staking.address, ether);
    await staking.stake(ether);
    expect(await vLandDao.balanceOf(owner.address)).to.equal(ether);

    await vLandDao.snapshot();

    await landDao.approve(staking.address, ether);
    await staking.stake(ether);
    expect(await vLandDao.balanceOf(owner.address)).to.equal(ether.mul(2));
    expect(await vLandDao.balanceOfAt(owner.address, 1)).to.equal(ether);
  });
});
