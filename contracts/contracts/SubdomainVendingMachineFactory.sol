// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {SubdomainVendingMachine} from "./SubdomainVendingMachine.sol";
import {IRNSRegistry} from "./interfaces/IRNSRegistry.sol";
import {IRNSResolver} from "./interfaces/IRNSResolver.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

error ZeroAddress();
error AlreadyDeployed();
error NotDomainOwner();

contract SubdomainVendingMachineFactory {
    IRNSRegistry public immutable registry;
    IRNSResolver public immutable defaultResolver;
    IERC20 public immutable rifToken;

    mapping(bytes32 => address) public vendingMachines; // parentNode => vendingMachine address
    mapping(address => bytes32[]) public ownerDomains; // owner => array of parentNodes

    event VendingMachineDeployed(
        bytes32 indexed parentNode,
        address indexed vendingMachine,
        address indexed owner,
        uint256 initialPrice
    );

    constructor(
        IRNSRegistry _registry,
        IRNSResolver _defaultResolver,
        IERC20 _rifToken
    ) {
        if (address(_registry) == address(0)) revert ZeroAddress();
        if (address(_defaultResolver) == address(0)) revert ZeroAddress();
        if (address(_rifToken) == address(0)) revert ZeroAddress();

        registry = _registry;
        defaultResolver = _defaultResolver;
        rifToken = _rifToken;
    }

    function deployVendingMachine(
        bytes32 parentNode,
        uint256 initialPrice,
        address owner
    ) external returns (address) {
        if (vendingMachines[parentNode] != address(0)) revert AlreadyDeployed();
        if (owner == address(0)) revert ZeroAddress();

        // Verify caller owns the parent domain
        if (registry.owner(parentNode) != msg.sender) {
            revert NotDomainOwner();
        }

        SubdomainVendingMachine vendingMachine = new SubdomainVendingMachine(
            registry,
            defaultResolver,
            rifToken,
            parentNode,
            initialPrice,
            owner
        );

        address vmAddress = address(vendingMachine);
        vendingMachines[parentNode] = vmAddress;
        ownerDomains[owner].push(parentNode);

        emit VendingMachineDeployed(parentNode, vmAddress, owner, initialPrice);

        return vmAddress;
    }

    function getVendingMachine(bytes32 parentNode) external view returns (address) {
        return vendingMachines[parentNode];
    }

    function getOwnerDomains(address owner) external view returns (bytes32[] memory) {
        return ownerDomains[owner];
    }
}
