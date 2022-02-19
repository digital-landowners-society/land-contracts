const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LandDAO", function () {
  it("Should return the new greeting once it's changed", async function () {
    const LandDAO = await ethers.getContractFactory("Greeter");
    const landDAO = await LandDAO.deploy("Hello, world!");
    await landDAO.deployed();

    expect(await landDAO.greet()).to.equal("Hello, world!");

    const setGreetingTx = await landDAO.setGreeting("Hola, mundo!");

    // wait until the transaction is mined
    await setGreetingTx.wait();

    expect(await landDAO.greet()).to.equal("Hola, mundo!");
  });
});
