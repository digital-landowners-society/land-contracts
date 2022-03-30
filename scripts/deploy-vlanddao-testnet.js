const hre = require("hardhat");

async function main() {
  const LandDao = await hre.ethers.getContractFactory("VLandDAO");
  const landDao = await LandDao.deploy("vTestDAO", "vTEST");
  await landDao.deployed();
  console.log("VLandDAO deployed to:", landDao.address);

  await hre.run("verify:verify", {
    address: landDao.address,
    constructorArguments: ["vTestDAO", "vTEST"],
  });
  console.log("Source Verified");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
