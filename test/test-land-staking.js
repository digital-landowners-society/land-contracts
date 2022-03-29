const {ethers, network} = require("hardhat");
const {expect} = require("chai");
const {BigNumber} = require("ethers");

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

const deploySubContract = async (landDao, factoryName) => {
  const factory = await ethers.getContractFactory(factoryName);
  const contract = await factory.deploy(
    "TestStaking",
    "vLAND",
    landDao.address
  );
  await contract.deployed();
  return contract;
};

describe("LandStacking stake", function () {
  it("Should be able to stake and un-stake", async function () {
    const landDao = await deployLandDao();
    const landStaking = await deploySubContract(landDao, "LandStaking");

    const [owner] = await ethers.getSigners();
    await landDao.sendTokens("treasury", owner.address);
    await landDao.sendTokens("singleStackingRewards", landStaking.address);

    const supply = await landStaking.totalSupply();
    expect(supply).to.equal(0);

    const rewards = await landDao.balanceOf(landStaking.address);
    expect(rewards).to.equal(ethers.utils.parseEther("30000000"));

    const balance = await landDao.balanceOf(owner.address);
    expect(balance).to.equal(ethers.utils.parseEther("100000000"));

    await landDao.approve(landStaking.address, ether);
    await landStaking.stake(ether);

    const newBalance = await landDao.balanceOf(owner.address);
    expect(newBalance).to.equal(ethers.utils.parseEther("100000000").sub(ether));
    const stackingBalance = await landStaking.balanceOf(owner.address);
    expect(stackingBalance).to.equal(ether);
    expect(await landStaking.totalSupply()).to.equal(ether);
    await network.provider.send("evm_mine");
    await landStaking.withdraw(ether);
    const timeLock = await landStaking.timeLocks(owner.address, 0);
    const lastBalance = await landDao.balanceOf(timeLock);
    expect(lastBalance).to.equal(ether);
    expect(await landStaking.balanceOf(owner.address)).to.equal(0);
    expect(await landStaking.totalSupply()).to.equal(0);
  });

  it("Should be able to distribute reward", async function () {
    const landDao = await deployLandDao();
    const landStaking = await deploySubContract(landDao, "LandStacking");

    const [owner] = await ethers.getSigners();
    await landDao.sendTokens("treasury", owner.address);
    await landDao.sendTokens("singleStackingRewards", landStaking.address);

    await landDao.approve(landStaking.address, ether);
    await landStaking.stake(ether);
    expect(await landStaking.balanceOf(owner.address)).to.equal(ether);
    expect(await landDao.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("99999999"));
    expect(await landStaking.totalSupply()).to.equal(ether);

    await landStaking.getReward();
    expect(await landDao.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("100000029"));

  });
});
