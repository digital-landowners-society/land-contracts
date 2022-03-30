const { ethers, network } = require("hardhat");
const { expect } = require("chai");

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

describe("LandStaking stake", function () {
  it("Should be able to stake and un-stake", async function () {
    const landDao = await deployLandDao();
    const vLandDao = await deployVLand();
    const staking = await deployStaking(landDao, vLandDao);
    await vLandDao.setStaking(staking.address);

    const [owner] = await ethers.getSigners();
    await landDao.sendTokens("treasury", owner.address);
    await landDao.sendTokens("singleStakingRewards", staking.address);

    const supply = await staking.totalSupply();
    expect(supply).to.equal(0);

    const rewards = await landDao.balanceOf(staking.address);
    expect(rewards).to.equal(ethers.utils.parseEther("30000000"));

    const balance = await landDao.balanceOf(owner.address);
    expect(balance).to.equal(ethers.utils.parseEther("100000000"));

    await landDao.approve(staking.address, ether);
    await staking.stake(ether);

    const newBalance = await landDao.balanceOf(owner.address);
    expect(newBalance).to.equal(ethers.utils.parseEther("100000000").sub(ether));
    const stakingBalance = await staking.balanceOf(owner.address);
    expect(stakingBalance).to.equal(ether);
    expect(await staking.totalSupply()).to.equal(ether);
    await network.provider.send("evm_mine");
    await staking.withdraw(ether);
    const timeLock = await staking.timeLocks(owner.address, 0);
    const lastBalance = await landDao.balanceOf(timeLock);
    expect(lastBalance).to.equal(ether);
    expect(await staking.balanceOf(owner.address)).to.equal(0);
    expect(await staking.totalSupply()).to.equal(0);
  });

  it("Should be able to distribute reward", async function () {
    const landDao = await deployLandDao();
    const vLandDao = await deployVLand();
    const staking = await deployStaking(landDao, vLandDao);
    await vLandDao.setStaking(staking.address);

    const [owner] = await ethers.getSigners();
    await landDao.sendTokens("treasury", owner.address);
    await landDao.sendTokens("singleStakingRewards", staking.address);

    await landDao.approve(staking.address, ether);
    await staking.stake(ether);
    expect(await staking.balanceOf(owner.address)).to.equal(ether);
    expect(await landDao.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("99999999"));
    expect(await staking.totalSupply()).to.equal(ether);

    await staking.getReward();
    expect(await landDao.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("100000029"));

  });
});
