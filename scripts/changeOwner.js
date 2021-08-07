/**
 * Changes owner on live MerkleRedeem contract and approves MerkleRedeem
 * to max spend $WORK tokens from that new owner address
 */
const hre = require("hardhat");
const ethers = hre.ethers;
const config = require("../config.json");

// enter new owner address here
const NEW_OWNER_ADDRESS = ""

async function main() {
  // swap owner
  const signer = await ethers.getSigner();
  const redeem = new ethers.Contract(
    config.merkleContractAddress,
    [
      "function transferOwnership(address newOwner) public",
      "function owner() public view returns (address)"
    ],
    signer
  );

  console.log(`changing owner`);
  const approvalTx = await redeem.transferOwnership(
    NEW_OWNER_ADDRESS
  );
  const approvalReceipt = await approvalTx.wait();
  console.log(
    `Approval tx mined, gas used ${approvalReceipt.gasUsed.toString()}`
  );
  console.log("new owner:", await redeem.owner())

  // approve max spend limit for work token for new owner on merkle drop
  const workToken = new ethers.Contract(
    config.workTokenAddress,
    [
      "function approve(address spender, uint256 amount) external returns (bool)",
    ],
    signer
  );

  console.log(`Approving MerkleRedeem to max spend $WORK tokens from new owner`);
  const approvalTx = await workToken.approve(
    config.merkleContractAddress,
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
