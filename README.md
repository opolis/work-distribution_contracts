# work-distribution_contracts

Merkle tree redemption contract for distributing $WORK tokens. Tokens are distributed on a per-epoch basis and claimees can claim from past epochs at any time.

Based on [https://github.com/balancer-labs/erc20-redeemable/tree/master/merkle](Balancer Labs Merkle Distributor) with modifications to use Hardhat/ethers.

## Merkle Redeem Contract

Ownable Merkle tree contract for making ERC-20 token distributions.

### Functions:

- **disburse** - transfers tokens from contract to recipient
```
function disburse(address _recipient, uint _balance) private
```

- **_claimEpoch** performs verification checks, marks epoch claimed and emits Claimed event
```
function _claimEpoch(address _recipient, uint _epoch, uint _claimedBalance, bytes32[] memory _merkleProof) private
```

- **claimEpoch** claim tokens for the selected epoch
```
function claimEpoch(address _recipient, uint _epoch, uint _claimedBalance, bytes32[] memory _merkleProof) public
```

- **claimEpochs** claim tokens for multiple pochs
```
function claimEpochs(address _recipient, Claim[] memory claims) public
```

- **merkleRoots** returns the merkle roots for the specified range of epochs
```
function merkleRoots(uint _begin, uint _end) external view returns (bytes32[] memory)
```

- **verifyClaim** verifies a claim
```
function verifyClaim(address _recipient, uint _epoch, uint _claimedBalance, bytes32[] memory _merkleProof) public view returns (bool valid)
```

- **seedAllocations** uploads the merkle root and transfers the token allocation from the sender to the contract
```
function seedAllocations(uint _epoch, bytes32 _merkleRoot, uint _totalAllocation) external onlyOwner
```

### Events:
- **Claimed** returns address and claimed balance of claimer when claim completes
- **RootAdded** returns epoch number and total token allocation when new root is uploaded


## Scripts
### Compile

`npm run compile` compiles all contracts and outputs ABIs to `./abis`
### Deploy

Deploys Merkle Redeem contract with specified $WORK token address, sets the deployer as the contract owner and max approves the MerkleRedeem contract to spend $WORK tokens from the owner.
1. Make a copy of `config.example.json` called `config.json`
2. Enter the address of the $WORK token contract as `workTokenAddress` in `config.json`
3. Enter the private key for the deployer account as `privateKey` in `config.json`. This account will be the owner of the contract.
4. `npm run compile`
5. `npm run deploy`

### Create MerkleTree

1. Make a copy of `config.example.json` called `config.json`
2. Enter the private key for the owner account as `privateKey` in `config.json`.
3. Enter the address of the MerkleRedeem contract as `merkleContractAddress` in `config.json`.
4. Enter the current epoch as `epoch` in `config.json`.
5. `npm run create`

### Claim Epoch

Claims the tokens for the first address in the proof data structure for the epoch specified in the config.
1. Make a copy of `config.example.json` called `config.json`
2. Enter the private key for the owner account as `privateKey` in `config.json`.
3. Enter the address of the MerkleRedeem contract as `merkleContractAddress` in `config.json`.
4. Enter the current epoch as `epoch` in `config.json`.
5. `npm run claim`
