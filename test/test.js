const { expect } = require("chai");
const { MerkleTree } = require("../lib/merkleTree");

const DAY = 60 * 60 * 24;

describe("MerkleRedeem", function () {
  let testToken;
  let redeem;
  let accounts;

  beforeEach(async () => {
    const TestToken = await ethers.getContractFactory("TestToken");
    const MerkleRedeem = await ethers.getContractFactory("MerkleRedeem");

    testToken = await TestToken.deploy();
    await testToken.deployed();

    redeem = await MerkleRedeem.deploy(testToken.address);
    await redeem.deployed();

    accounts = await ethers.getSigners();
    await testToken.mint(
      accounts[0].address,
      ethers.utils.parseUnits("1450000")
    );
    await testToken.approve(redeem.address, ethers.constants.MaxUint256);
  });

  it("Addresses should be set correctly", async function () {
    expect(await redeem.token()).to.equal(testToken.address);
    expect(await redeem.owner()).to.equal(accounts[0].address);
  });

  it("stores an allocation", async () => {
    let claimBalance = ethers.utils.parseUnits("9876");

    const elements = [
      ethers.utils.solidityKeccak256(
        ["bytes", "uint"],
        [accounts[0].address, claimBalance]
      ),
    ];
    const merkleTree = new MerkleTree(elements);
    const root = merkleTree.getHexRoot();

    await redeem.seedAllocations(1, root, ethers.utils.parseUnits("145000"));

    const proof = merkleTree.getHexProof(elements[0]);

    let result = await redeem.verifyClaim(
      accounts[0].address,
      1,
      claimBalance,
      proof
    );
    expect(result).to.equal(true);
  });

  it("doesn't allow an allocation to be overwritten", async () => {
    let claimBalance = ethers.utils.parseUnits("9876");

    const elements = [
      ethers.utils.solidityKeccak256(
        ["bytes", "uint"],
        [accounts[0].address, claimBalance]
      ),
    ];
    const merkleTree = new MerkleTree(elements);
    const root = merkleTree.getHexRoot();

    await redeem.seedAllocations(1, root, ethers.utils.parseUnits("145000"));

    // construct tree to attempt to override the allocation
    const elements2 = [
      ethers.utils.solidityKeccak256(
        ["bytes", "uint"],
        [accounts[0].address, claimBalance]
      ),
      ethers.utils.solidityKeccak256(
        ["bytes", "uint"],
        [accounts[1].address, claimBalance]
      ),
    ];
    const merkleTree2 = new MerkleTree(elements2);
    const root2 = merkleTree2.getHexRoot();

    await expect(
      redeem.seedAllocations(1, root2, ethers.utils.parseUnits("145000"))
    ).to.be.revertedWith("cannot rewrite merkle root");
  });

  it("stores multiple allocations", async () => {
    let claimBalance0 = ethers.utils.parseUnits("1000");
    let claimBalance1 = ethers.utils.parseUnits("2000");

    const elements = [
      ethers.utils.solidityKeccak256(
        ["bytes", "uint"],
        [accounts[0].address, claimBalance0]
      ),
      ethers.utils.solidityKeccak256(
        ["bytes", "uint"],
        [accounts[1].address, claimBalance1]
      ),
    ];
    const merkleTree = new MerkleTree(elements);
    const root = merkleTree.getHexRoot();

    await redeem.seedAllocations(1, root, ethers.utils.parseUnits("145000"));

    let proof0 = merkleTree.getHexProof(elements[0]);
    let result = await redeem.verifyClaim(
      accounts[0].address,
      1,
      claimBalance0,
      proof0
    );
    expect(result).to.equal(true);

    let proof1 = merkleTree.getHexProof(elements[1]);
    result = await redeem.verifyClaim(
      accounts[1].address,
      1,
      claimBalance1,
      proof1
    );
    expect(result).to.equal(true);
  });

  it("Reverts when the user attempts to claim before an allocation is produced", async () => {
    const claimBalance = ethers.utils.parseUnits("1000");
    const elements = [
      ethers.utils.solidityKeccak256(
        ["bytes", "uint"],
        [accounts[1].address, claimBalance]
      ),
    ];
    const merkleTree = new MerkleTree(elements);

    await network.provider.send("evm_increaseTime", [7 * DAY]);
    await network.provider.send("evm_mine");

    let claimedBalance = ethers.utils.parseUnits("1000");

    const merkleProof = merkleTree.getHexProof(elements[0]);

    await expect(
      redeem
        .connect(accounts[1])
        .claimEpoch(accounts[1].address, 1, claimedBalance, merkleProof)
    ).to.be.revertedWith("");
  });

  it("Allows the user to claimEpoch", async () => {
    const claimBalance = ethers.utils.parseUnits("1000");
    const elements = [
      ethers.utils.solidityKeccak256(
        ["bytes", "uint"],
        [accounts[1].address, claimBalance]
      ),
    ];
    const merkleTree = new MerkleTree(elements);
    const root = merkleTree.getHexRoot();

    await redeem.seedAllocations(1, root, ethers.utils.parseUnits("145000"));

    let claimedBalance = ethers.utils.parseUnits("1000");
    const merkleProof = merkleTree.getHexProof(elements[0]);

    await redeem
      .connect(accounts[1])
      .claimEpoch(accounts[1].address, 1, claimedBalance, merkleProof);

    let result = await testToken.balanceOf(accounts[1].address);
    expect(result).to.equal(claimedBalance);

    result = await redeem.claimed(1, accounts[1].address);
    expect(result).to.equal(true);
  });

  it("Doesn't allow a user to claim for another user", async () => {
    const claimBalance = ethers.utils.parseUnits("1000");
    const elements = [
      ethers.utils.solidityKeccak256(
        ["bytes", "uint"],
        [accounts[1].address, claimBalance]
      ),
    ];
    const merkleTree = new MerkleTree(elements);

    await network.provider.send("evm_increaseTime", [6 * DAY]);
    let claimedBalance = ethers.utils.parseUnits("1000");
    const merkleProof = merkleTree.getHexProof(elements[0]);

    await expect(
      redeem
        .connect(accounts[2])
        .claimEpoch(accounts[2].address, 1, claimedBalance, merkleProof)
    ).to.be.revertedWith("");
  });

  it("Reverts when the user attempts to claim the wrong balance", async () => {
    const claimBalance = ethers.utils.parseUnits("1000");
    const elements = [
      ethers.utils.solidityKeccak256(
        ["bytes", "uint"],
        [accounts[1].address, claimBalance]
      ),
    ];
    const merkleTree = new MerkleTree(elements);

    let claimedBalance = ethers.utils.parseUnits("666");
    const merkleProof = merkleTree.getHexProof(elements[0]);

    await expect(
      redeem
        .connect(accounts[1])
        .claimEpoch(accounts[1].address, 1, claimedBalance, merkleProof)
    ).to.be.revertedWith("");
  });

  it("Reverts when the user attempts to claim twice", async () => {
    const claimBalance = ethers.utils.parseUnits("1000");
    const elements = [
      ethers.utils.solidityKeccak256(
        ["bytes", "uint"],
        [accounts[1].address, claimBalance]
      ),
    ];
    const merkleTree = new MerkleTree(elements);
    const root = merkleTree.getHexRoot();

    await redeem.seedAllocations(1, root, ethers.utils.parseUnits("145000"));

    await network.provider.send("evm_increaseTime", [1 * DAY]);
    let claimedBalance = ethers.utils.parseUnits("1000");
    const merkleProof = merkleTree.getHexProof(elements[0]);

    await redeem
      .connect(accounts[1])
      .claimEpoch(accounts[1].address, 1, claimedBalance, merkleProof);

    await expect(
      redeem
        .connect(accounts[1])
        .claimEpoch(accounts[1].address, 1, claimedBalance, merkleProof)
    ).to.be.revertedWith("");
  });

  describe("When a user has several allocations to claim", () => {
    let claimBalance1;
    let elements1;
    let merkleTree1;
    let root1;

    let claimBalance2;
    let elements2;
    let merkleTree2;
    let root2;

    beforeEach(async () => {
      accounts = await ethers.getSigners();
      claimBalance1 = ethers.utils.parseUnits("1000");
      elements1 = [
        ethers.utils.solidityKeccak256(
          ["bytes", "uint"],
          [accounts[1].address, claimBalance1]
        ),
      ];
      merkleTree1 = new MerkleTree(elements1);
      root1 = merkleTree1.getHexRoot();

      claimBalance2 = ethers.utils.parseUnits("1234");
      elements2 = [
        ethers.utils.solidityKeccak256(
          ["bytes", "uint"],
          [accounts[1].address, claimBalance2]
        ),
      ];
      merkleTree2 = new MerkleTree(elements2);
      root2 = merkleTree2.getHexRoot();

      await redeem.seedAllocations(1, root1, ethers.utils.parseUnits("145000"));

      await network.provider.send("evm_increaseTime", [7 * DAY]);
      await network.provider.send("evm_mine");
      await redeem.seedAllocations(2, root2, ethers.utils.parseUnits("145000"));
    });

    it("Allows the user to claim once the time has past", async () => {
      await network.provider.send("evm_increaseTime", [8 * DAY]);
      await network.provider.send("evm_mine");

      let claimedBalance1 = ethers.utils.parseUnits("1000");
      let claimedBalance2 = ethers.utils.parseUnits("1234");

      const proof1 = merkleTree1.getHexProof(elements1[0]);
      await redeem
        .connect(accounts[1])
        .claimEpoch(accounts[1].address, 1, claimedBalance1, proof1);

      const proof2 = merkleTree2.getHexProof(elements2[0]);
      await redeem
        .connect(accounts[1])
        .claimEpoch(accounts[1].address, 2, claimedBalance2, proof2);

      let result = await testToken.balanceOf(accounts[1].address);
      expect(result).to.equal(ethers.utils.parseUnits("2234"));
    });

    it("Allows the user to claim multiple epochs at once", async () => {
      await network.provider.send("evm_increaseTime", [8 * DAY]);
      await network.provider.send("evm_mine");

      let claimedBalance1 = ethers.utils.parseUnits("1000");
      let claimedBalance2 = ethers.utils.parseUnits("1234");

      const proof1 = merkleTree1.getHexProof(elements1[0]);
      const proof2 = merkleTree2.getHexProof(elements2[0]);

      await redeem.connect(accounts[1]).claimEpochs(accounts[1].address, [
        [1, claimedBalance1, proof1],
        [2, claimedBalance2, proof2],
      ]);

      let result = await testToken.balanceOf(accounts[1].address);
      expect(result).to.equal(ethers.utils.parseUnits("2234"));
    });
    
    it("Returns an array of merkle roots", async () => {
      let expectedResult = [root1, root2];
      let result = await redeem.merkleRoots(1, 2);
      expect(result).to.deep.equal(expectedResult);
    });
  });
});
