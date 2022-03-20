const { expect } = require("chai");
const { ethers } = require("hardhat");

const deployContract = async () => {
  const landDaoFactory = await ethers.getContractFactory("LandDAO");
  const landDao = await landDaoFactory.deploy(
    "LandDAO",
    "LAND",
    "0x0000000000000000000000000000000000000000"
  );
  await landDao.deployed();
  return landDao;
};

describe("LandDAO Deploy", function () {
  it("Should return the total supply", async function () {
    const landDao = await deployContract();
    const totalSupply = await landDao.totalSupply();
    const expectedTotalSupply = ethers.utils.parseEther("1000000000");
    expect(totalSupply).to.equal(expectedTotalSupply);
  });

  it("Should send tokens", async function () {
    const landDao = await deployContract();
    const [owner, addr1] = await ethers.getSigners();
    await landDao.sendTokens("poolRewards", addr1.address);
    const expectedBalance = ethers.utils.parseEther("340000000");
    expect(await landDao.balanceOf(owner.address)).to.equal(0);
    expect(await landDao.balanceOf(addr1.address)).to.equal(expectedBalance);
  });

  it("Should not double-send tokens", async function () {
    const landDao = await deployContract();
    const [owner, addr1] = await ethers.getSigners();
    await landDao.sendTokens("poolRewards", owner.address);
    const expectedBalance = ethers.utils.parseEther("340000000");
    await expect(
      landDao.connect(addr1).sendTokens("landOwners", owner.address)
    ).to.be.revertedWith("Ownable: caller is not the owner");
    expect(await landDao.balanceOf(owner.address)).to.equal(expectedBalance);
    await expect(
      landDao.sendTokens("landOwners", owner.address
    )).to.be.revertedWith("LandDao: not eligible");
    await expect(
      landDao.sendTokens("landOwners1", owner.address)
    ).to.be.revertedWith("LandDao: not eligible");
  });
});
