// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const ethers = hre.ethers;
const config = require("../config.json");

async function main() {
  // get data
  let data;
  try {
    data = require(`../proofs/proof_epoch_${config.epoch}.json`);
  } catch {
    console.error(`No Merkle data found for epoch ${config.epoch}`);
    return;
  }

  // create MerkleRedeem contract
  const MerkleRedeem = await ethers.getContractFactory("MerkleRedeem");
  const redeem = await MerkleRedeem.attach(config.merkleContractAddress);

  // claim
  console.log(
    `Claiming ${data[0].claimBalance} tokens for address ${data[0].address}, epoch number ${config.epoch}`
  );
  const claimTx = await redeem.claimEpoch(
    data[0].address,
    config.epoch,
    data[0].claimBalance,
    data[0].proof
  );
  const claimReceipt = await claimTx.wait();
  console.log(`Claim tx mined, gas used ${claimReceipt.gasUsed.toString()}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
