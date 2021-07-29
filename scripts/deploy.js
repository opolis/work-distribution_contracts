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

  // approve max spend limit for work token
  const signer = await ethers.getSigner();
  const workToken = new ethers.Contract(
    config.workTokenAddress,
    [
      "function approve(address spender, uint256 amount) external returns (bool)",
    ],
    signer
  );

  console.log(`Approving MerkleRedeem to max spend $WORK tokens (wei)...`);
  const approvalTx = await workToken.approve(
    redeem.address,
    ethers.constants.MaxUint256
  );
  const approvalReceipt = await approvalTx.wait();
  console.log(
    `Approval tx mined, gas used ${approvalReceipt.gasUsed.toString()}`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
