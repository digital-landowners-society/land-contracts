const hre = require("hardhat");

function sleep(s) {
  return new Promise(resolve => setTimeout(resolve, s*1000));
}

async function main() {
  const LandStaking = await hre.ethers.getContractFactory("LandStaking");
  const landStaking = await LandStaking.deploy(
    "0x9792C97C6EC5361289BE9392E601a58222b18f66", // LandDAO
    "0xDDFe0FA479A78784B879AAf3d0d8c529e9135E7D", // vLandDAO
  );
  await landStaking.deployed();
  console.log("LandDao staking deployed to:", landStaking.address);

  await sleep(10);

  await hre.run("verify:verify", {
    address: landStaking.address,
    constructorArguments: [
      "0x9792C97C6EC5361289BE9392E601a58222b18f66", // LandDAO
      "0xDDFe0FA479A78784B879AAf3d0d8c529e9135E7D", // vLandDAO
    ],
  });
  console.log("Source Verified");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
