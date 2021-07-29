// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.4;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MerkleRedeem is Ownable {

    IERC20 public token;

    event Claimed(address _claimant, uint256 _balance);
    event RootAdded(uint256 epoch, uint256 _totalAllocation);

    // Recorded epochs
    mapping(uint => bytes32) public epochMerkleRoots;
    mapping(uint => mapping(address => bool)) public claimed;

    constructor(
        address _token
    ) public {
        token = IERC20(_token);
    }

    function disburse(
        address _recipient,
        uint _balance
    )
        private
    {
        if (_balance > 0) {
            emit Claimed(_recipient, _balance);
            require(token.transfer(_recipient, _balance), "ERR_TRANSFER_FAILED");
        }
    }

    function claimEpoch(
        address _recipient,
        uint _epoch,
        uint _claimedBalance,
        bytes32[] memory _merkleProof
    )
        public
    {
        require(!claimed[_epoch][_recipient]);
        require(verifyClaim(_recipient, _epoch, _claimedBalance, _merkleProof), 'Incorrect merkle proof');

        claimed[_epoch][_recipient] = true;
        disburse(_recipient, _claimedBalance);
    }

    struct Claim {
        uint epoch;
        uint balance;
        bytes32[] merkleProof;
    }

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

            require(!claimed[claim.epoch][_recipient]);
            require(verifyClaim(_recipient, claim.epoch, claim.balance, claim.merkleProof), 'Incorrect merkle proof');

            totalBalance += claim.balance;
            claimed[claim.epoch][_recipient] = true;
        }
        disburse(_recipient, totalBalance);
    }

    function claimStatus(
        address _recipient,
        uint _begin,
        uint _end
    )
        external
        view
        returns (bool[] memory)
    {
        uint size = 1 + _end - _begin;
        bool[] memory arr = new bool[](size);
        for(uint i = 0; i < size; i++) {
            arr[i] = claimed[_begin + i][_recipient];
        }
        return arr;
    }

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