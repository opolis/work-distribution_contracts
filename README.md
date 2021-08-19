# License 
GNU LESSER GENERAL PUBLIC LICENSE (see https://www.gnu.org/licenses/lgpl-3.0.html)

# work-distribution_contracts

Merkle tree redemption contract for distributing $WORK tokens. Tokens are distributed on a per-epoch basis and claimees can claim from past epochs at any time.

Based on [Balancer Labs Merkle Distributor](https://github.com/balancer-labs/erc20-redeemable/tree/master/merkle) with modifications to use Hardhat/ethers.

## Merkle Redeem Contract

Ownable Merkle tree contract for making ERC-20 token distributions.

### Functions:

- **constructor** - takes the address of the token to be disbursed
```
constructor(address _token) public
```

- **_disburse** - transfers tokens from contract to recipient
```
function _disburse(address _recipient, uint _balance) private
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

- **newRoot** uploads the merkle root if the Merkle contract holds enough tokens to cover redemptions.
```
function newRoot(uint _epoch, bytes32 _merkleRoot, uint _totalAllocation) external onlyOwner
```

### Events:
- **Claimed** returns address, epoch and claimed balance when claim completes
- **RootAdded** returns address of sender, epoch number and total token allocation when new root is uploaded


## Scripts

The default network for all scripts is Polygon network.
### Compile

`npm run compile` compiles all contracts and outputs ABIs to `./abis`

### Test

`npm run test` runs unit tests and performs gas profiling
### Deploy

Deploys Merkle Redeem contract with specified $WORK token address, sets the deployer as the contract owner.
1. Make a copy of `config.example.json` called `config.json`.
2. Enter the address of the $WORK token contract as `workTokenAddress` in `config.json`.
3. Enter the private key for the deployer account as `privateKey` in `config.json`. This account will be the owner of the contract.
4. `npm run compile`
5. `npm run deploy`

### Create MerkleTree

1. Make a copy of `config.example.json` called `config.json`.
2. Enter the private key for the owner account as `privateKey` in `config.json`.
3. Enter the address of the MerkleRedeem contract as `merkleContractAddress` in `config.json`.
4. Enter the current epoch as `epoch` in `config.json`.
5. Create a file `claims/claims_[epoch].json` with the claims data in the following form where `claimBalance` is the in the base token unit amount or wei.
```
[
  {
    address: "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
    claimBalance: "1111111111111"
  },
  ...
]
```
6. `npm run create`

### Claim Epoch

Claims the tokens for the first address in the proof data structure for the epoch specified in the config.
1. Make a copy of `config.example.json` called `config.json`.
2. Enter the private key for the owner account as `privateKey` in `config.json`.
3. Enter the address of the MerkleRedeem contract as `merkleContractAddress` in `config.json`.
4. Enter the current epoch as `epoch` in `config.json`.
5. `npm run claim`
