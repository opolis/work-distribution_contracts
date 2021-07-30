// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.4;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MerkleRedeem is Ownable {

    IERC20 public token;

    event Claimed(address indexed claimant, uint256 epoch, uint256 balance);
    event RootAdded(uint256 epoch, uint256 totalAllocation);

    // Recorded epochs
    mapping(uint => bytes32) public epochMerkleRoots;
    mapping(uint => mapping(address => bool)) public claimed;

    constructor(
        address _token
    ) public {
        token = IERC20(_token);
    }


    // PRIVATE FUNCTIONS
    /// @notice sends token amount to recipient if _balance is greater than 0
    /// @param _recipient address to send to
    /// @param _balance amount to send
    function _disburse(
        address _recipient,
        uint _balance
    )
        private
    {
        if (_balance > 0) {
            require(token.transfer(_recipient, _balance), "ERR_TRANSFER_FAILED");
        }
    }

    /// @notice performs internal verification checks that the proof is valid and marks claim as claimed
    /// @param _recipient address to check
    /// @param _epoch epoch to check
    /// @param _claimedBalance amount that address wants to claim
    /// @param _merkleProof merkle proof for claim
    function _claimEpoch(
        address _recipient,
        uint _epoch,
        uint _claimedBalance,
        bytes32[] memory _merkleProof
    ) private {
        require(!claimed[_epoch][_recipient]);
        require(verifyClaim(_recipient, _epoch, _claimedBalance, _merkleProof), 'Incorrect merkle proof');

        claimed[_epoch][_recipient] = true;
        emit Claimed(_recipient, _epoch, _claimedBalance);
    }

    // PUBLIC FUNCTIONS
    /// @notice public function to claim tokens for a single epoch
    /// @param _recipient address to check
    /// @param _epoch epoch to check
    /// @param _claimedBalance amount that address wants to claim
    /// @param _merkleProof merkle proof for claim
    function claimEpoch(
        address _recipient,
        uint _epoch,
        uint _claimedBalance,
        bytes32[] memory _merkleProof
    )
        public
    {
        _claimEpoch(_recipient, _epoch, _claimedBalance, _merkleProof);
        _disburse(_recipient, _claimedBalance);
    }

    struct Claim {
        uint epoch;
        uint balance;
        bytes32[] merkleProof;
    }

    /// @notice public function to claim for multiple epochs
    /// @param claims an array of Claim structs with data for each epoch
    function claimEpochs(
        address _recipient,
        Claim[] memory claims
    )
        public
    {
        uint totalBalance = 0;
        Claim memory claim ;
        for(uint i = 0; i < claims.length; i++) {
            claim = claims[i];
            _claimEpoch(_recipient, claim.epoch, claim.balance, claim.merkleProof);
            totalBalance += claim.balance;
        }
        _disburse(_recipient, totalBalance);
    }

    // VIEWS
    /// @notice returns merkleRoots for epochs in the specified range
    /// @param _begin first epoch
    /// @param _end last epoch
    /// @return array of merkle roots
    function merkleRoots(
        uint _begin,
        uint _end
    ) 
        external
        view 
        returns (bytes32[] memory)
    {
        uint size = 1 + _end - _begin;
        bytes32[] memory arr = new bytes32[](size);
        for(uint i = 0; i < size; i++) {
            arr[i] = epochMerkleRoots[_begin + i];
        }
        return arr;
    }

    /// @notice verifies that the token claim and merkle proof are valid for the recipient
    /// @param _recipient address to check
    /// @param _epoch epoch to check
    /// @param _claimedBalance amount that address wants to claim
    /// @param _merkleProof merkle proof for claim
    /// @return valid true or false if the claim is valid
    function verifyClaim(
        address _recipient,
        uint _epoch,
        uint _claimedBalance,
        bytes32[] memory _merkleProof
    )
        public
        view
        returns (bool valid)
    {
        bytes32 leaf = keccak256(abi.encodePacked(_recipient, _claimedBalance));
        return MerkleProof.verify(_merkleProof, epochMerkleRoots[_epoch], leaf);
    }

    // OWNER ONLY
    /// @notice writes merkle root for the selected epoch and transfers necessary tokens from the owner
    /// @param _epoch new epoch number
    /// @param _merkleRoot merkle root for the new epoch
    /// @param _totalAllocation total number of tokens to be transferred from the owner for claims
    function seedAllocations(
        uint _epoch,
        bytes32 _merkleRoot,
        uint _totalAllocation
    )
        external
        onlyOwner
    {
        require(epochMerkleRoots[_epoch] == bytes32(0), "cannot rewrite merkle root");
        epochMerkleRoots[_epoch] = _merkleRoot;

        require(token.transferFrom(msg.sender, address(this), _totalAllocation), "ERR_TRANSFER_FAILED");
        emit RootAdded(_epoch, _totalAllocation);
    }
}