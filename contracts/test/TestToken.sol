// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * Simple token contract for running MerkleRedeem tests
 */
contract TestToken is ERC20 {
    constructor() public ERC20("TestToken", "TT") {
        mint(msg.sender, 100 ether);
    }

    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }
}