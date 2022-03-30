const hre = require("hardhat");

function sleep(s) {
  return new Promise(resolve => setTimeout(resolve, s*1000));
}

async function main() {
  const VLandDao = await hre.ethers.getContractFactory("VLandDAO");
  const vLandDao = await VLandDao.deploy("vTestDAO1", "vTEST1");
  await vLandDao.deployed();
  console.log("VLandDAO deployed to:", vLandDao.address);
  await sleep(10);
  await hre.run("verify:verify", {
    address: vLandDao.address,
    constructorArguments: ["vTestDAO1", "vTEST1"],
  });
  console.log("Source Verified");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
