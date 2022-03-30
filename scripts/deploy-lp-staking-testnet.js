const hre = require("hardhat");

async function main() {
  const LandLpStaking = await hre.ethers.getContractFactory("LPStaking");
  const landLpStaking = await LandLpStaking.deploy(
    "xTestDAO",
    "xTEST",
    "0x77cf6f9b71bb02857e8b341cee3130b4f7f996e0",
    "0x2cFd5F8E8C89c0bcEd8b71d2547da8a7f7cFE9b4",
  );
  await landLpStaking.deployed();
  console.log("LandDao staking deployed to:", landLpStaking.address);

  await hre.run("verify:verify", {
    address: landLpStaking.address,
    constructorArguments: [
      "xTestDAO",
      "xTEST",
      "0x77cf6f9b71bb02857e8b341cee3130b4f7f996e0",
      "0x2cFd5F8E8C89c0bcEd8b71d2547da8a7f7cFE9b4",
    ],
  });
  console.log("Source Verified");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
