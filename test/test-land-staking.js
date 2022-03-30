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

  it("Should be able to exit", async function () {
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

    await staking.exit();
    expect(await landDao.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("100000029"));
    const timeLock = await staking.timeLocks(owner.address, 0);
    const lastBalance = await landDao.balanceOf(timeLock);
    expect(lastBalance).to.equal(ether);
  });

  it("Should be able to withdraw and get reward", async function () {
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

    await staking.withdrawAndGetReward(ether);
    expect(await landDao.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("100000029"));
    const timeLock = await staking.timeLocks(owner.address, 0);
    const lastBalance = await landDao.balanceOf(timeLock);
    expect(lastBalance).to.equal(ether);
  });

  it("Should be able to pause", async function () {
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
    await staking.pause();
    await expect(staking.withdrawAndGetReward(ether)).to.be.revertedWith("Pausable: paused");
    await staking.unpause();
    await staking.exit();
  });

  it("Should be unable to transfer", async function () {
    const landDao = await deployLandDao();
    const vLandDao = await deployVLand();
    const staking = await deployStaking(landDao, vLandDao);
    await vLandDao.setStaking(staking.address);

    const [owner, addr1] = await ethers.getSigners();
    await landDao.sendTokens("treasury", owner.address);
    await landDao.sendTokens("singleStakingRewards", staking.address);

    await landDao.approve(staking.address, ether);
    await staking.stake(ether);
    expect(await staking.balanceOf(owner.address)).to.equal(ether);
    expect(await landDao.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("99999999"));
    expect(await staking.totalSupply()).to.equal(ether);
    expect(await vLandDao.balanceOf(owner.address)).to.equal(ether);
    await expect(vLandDao.transfer(addr1.address, ether)).to.be.reverted;
  });

  it("Should be unable to withdraw with time lock", async function () {
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
    expect(await vLandDao.balanceOf(owner.address)).to.equal(ether);
    await staking.withdraw(ether);
    const timeLock = await staking.timeLocks(owner.address, 0);
    expect(await landDao.balanceOf(timeLock)).to.equal(ether);

    let abi = [ "function release()" ];
    let iface = new ethers.utils.Interface(abi);
    const data = iface.encodeFunctionData("release");
    await expect(owner.sendTransaction({to: timeLock, data: data})).to.revertedWith("TokenTimelock: current time is before release time");

    const nextDate = 3600 * 24 * 31;
    await network.provider.send("evm_increaseTime", [nextDate]);
    await network.provider.send("evm_mine");
    await owner.sendTransaction({to: timeLock, data: data});

    expect(await landDao.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("100000000"));
  });

  it("Should be unable to claim all rewards", async function () {
    const landDao = await deployLandDao();
    const vLandDao = await deployVLand();
    const staking = await deployStaking(landDao, vLandDao);
    await vLandDao.setStaking(staking.address);

    const [owner, addr1] = await ethers.getSigners();
    await landDao.sendTokens("treasury", owner.address);
    await landDao.sendTokens("team", addr1.address);
    await landDao.sendTokens("singleStakingRewards", staking.address);

    await landDao.approve(staking.address, ether);
    await landDao.connect(addr1).approve(staking.address, ether);
    await staking.stake(ether);
    await staking.connect(addr1).stake(ether);
    for (let i = 0; i < 1000; i++) {
      await network.provider.send("evm_mine");
    }
    const startingBalance = await landDao.balanceOf(addr1.address);

    await staking.exit();

    const reward = ether.mul(30).mul(1001).div(2).add(ether.mul(30));
    expect(await landDao.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("99999999").add(reward));

    await staking.connect(addr1).getReward();
    expect(await landDao.balanceOf(addr1.address)).to.equal(startingBalance.add(reward));
  });
});
