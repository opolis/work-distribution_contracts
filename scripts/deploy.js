// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const ethers = hre.ethers;
const config = require("../config.json");

async function main() {
  const MerkleRedeem = await ethers.getContractFactory("MerkleRedeem");
  const redeem = await MerkleRedeem.deploy(config.workTokenAddress);

  await redeem.deployed();

  console.log("MerkleRedeem deployed to:", redeem.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
