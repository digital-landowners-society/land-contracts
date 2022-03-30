const hre = require("hardhat");

function sleep(s) {
  return new Promise(resolve => setTimeout(resolve, s*1000));
}

async function main() {
  const LandDao = await hre.ethers.getContractFactory("LandDAO");
  const landDao = await LandDao.deploy(
    "TestDAO1",
    "TEST1",
    "0xea8b08fdf5865b16cea49cbfc20bc8bf64da6e97" // DLS NFT
  );
  await landDao.deployed();
  console.log("LandDao deployed to:", landDao.address);

  await sleep(10);

  await hre.run("verify:verify", {
    address: landDao.address,
    constructorArguments: [
      "TestDAO1",
      "TEST1",
      "0xea8b08fdf5865b16cea49cbfc20bc8bf64da6e97", // DLS NFT
    ],
  });
  console.log("Source Verified");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
