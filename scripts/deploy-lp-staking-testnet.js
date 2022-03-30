const hre = require("hardhat");

async function main() {
  const LandLpStaking = await hre.ethers.getContractFactory("LPStaking");
  const landLpStaking = await LandLpStaking.deploy(
    "xTestDAO",
    "xTEST",
    "0x9792C97C6EC5361289BE9392E601a58222b18f66", // LandDAO
    "0x77cf6f9b71bb02857e8b341cee3130b4f7f996e0", // LP
  );
  await landLpStaking.deployed();
  console.log("LandDao staking deployed to:", landLpStaking.address);

  await hre.run("verify:verify", {
    address: landLpStaking.address,
    constructorArguments: [
      "xTestDAO",
      "xTEST",
      "0x9792C97C6EC5361289BE9392E601a58222b18f66", // LandDAO
      "0x77cf6f9b71bb02857e8b341cee3130b4f7f996e0", // LP
    ],
  });
  console.log("Source Verified");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
