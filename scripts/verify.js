// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  await hre.run("verify:verify", {
    address: "0x528cCC328ed9bC4e380Dc70d2616814B15a7FB63",
    constructorArguments: [
      "TestDAO",
      "TEST",
      "0x3f33eea734b01ec9e9bd1b44a3eb80c36ba585be",
    ],
  });

  console.log("Source Verified");

  await hre.run("verify:verify", {
    address: "0xD8598Ce75aF7BeA915A59B1B0b13c1543dd59EF3",
    constructorArguments: ["0x938323b4fcBcD564332E7B3392dd07b7Ec755E49"],
  });

  console.log("dlsDao verified");

  await hre.run("verify:verify", {
    address: "0x7fe1b383dFef2dFf99c89183E122FD969D79f3fF",
    constructorArguments: ["0x18Bb2c53E9f8C38E5BddF60955f462833705bD80"],
  });

  console.log("dlsNftOwner verified");

  await hre.run("verify:verify", {
    address: "0xec274E81762D70C21DE9081c9DF947D49589889B",
    constructorArguments: [
      "0x938323b4fcBcD564332E7B3392dd07b7Ec755E49",
      "0x825D66E34A1df88E1a977C69404e5dE8b3e7D8Ea",
    ],
  });

  console.log("landOwner verified");

  await hre.run("verify:verify", {
    address: "0xaD43c590290a58723B8F0b87D1E4cb7b746aFD32",
    constructorArguments: ["0x938323b4fcBcD564332E7B3392dd07b7Ec755E49"],
  });

  console.log("liquidity verified");

  await hre.run("verify:verify", {
    address: "0x455e12E4B256CF90e486b05a669E9d469EF45599",
    constructorArguments: ["0x938323b4fcBcD564332E7B3392dd07b7Ec755E49"],
  });

  console.log("pullRewards verified");

  await hre.run("verify:verify", {
    address: "0x9606866618e6812b6ff1c9b3844e2878d9ad0651",
    constructorArguments: ["0x938323b4fcBcD564332E7B3392dd07b7Ec755E49"],
  });

  console.log("staking verified");

  await hre.run("verify:verify", {
    address: "0x5bd6eede29c7605ae7b7d0ca7a5eec4a384f8869",
    constructorArguments: ["0x938323b4fcBcD564332E7B3392dd07b7Ec755E49"],
  });

  console.log("strategicSales verified");

  await hre.run("verify:verify", {
    address: "0xec97d8efa24f6801d422c87ed7d4088ad1a0b6a9",
    constructorArguments: ["0x938323b4fcBcD564332E7B3392dd07b7Ec755E49"],
  });

  console.log("team verified");

  await hre.run("verify:verify", {
    address: "0x3bf1ef011f6e7f058d05d7f45b0ae23983c46bc4",
    constructorArguments: ["0x938323b4fcBcD564332E7B3392dd07b7Ec755E49"],
  });

  console.log("treasury verified");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
