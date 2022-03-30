const hre = require("hardhat");

async function main() {
  const LandStaking = await hre.ethers.getContractFactory("LandStaking");
  const landStaking = await LandStaking.deploy(
    "vTestDAO",
    "vTEST",
    "0x2cFd5F8E8C89c0bcEd8b71d2547da8a7f7cFE9b4"
  );
  await landStaking.deployed();
  console.log("LandDao staking deployed to:", landStaking.address);

  await hre.run("verify:verify", {
    address: landStaking.address,
    constructorArguments: [
      "vTestDAO",
      "vTEST",
      "0x2cFd5F8E8C89c0bcEd8b71d2547da8a7f7cFE9b4",
    ],
  });
  console.log("Source Verified");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
