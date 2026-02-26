// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {IRNSRegistry} from "./interfaces/IRNSRegistry.sol";
import {IRNSResolver} from "./interfaces/IRNSResolver.sol";

error ZeroAddress();
error EmptyLabel();
error NotParentOwner();
error AlreadyRegistered();
error AmountZero();
error InsufficientBalance();

contract SubdomainVendingMachine is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IRNSRegistry public immutable registry;
    IRNSResolver public resolver;
    IERC20 public immutable rifToken;
    bytes32 public immutable parentNode;
    uint256 public pricePerSubdomain;

    event SubdomainRegistered(
        bytes32 indexed parentNode,
        bytes32 indexed labelhash,
        address indexed owner,
        uint256 price
    );

    event PriceUpdated(uint256 oldPrice, uint256 newPrice);

    event ResolverUpdated(address oldResolver, address newResolver);

    event FundsWithdrawn(address indexed to, uint256 amount);

    event ParentNodeReclaimed(address indexed to);

    constructor(
        IRNSRegistry _registry,
        IRNSResolver _resolver,
        IERC20 _rifToken,
        bytes32 _parentNode,
        uint256 _initialPrice,
        address _owner
    ) Ownable(_owner) {
        if (address(_registry) == address(0)) revert ZeroAddress();
        if (address(_resolver) == address(0)) revert ZeroAddress();
        if (address(_rifToken) == address(0)) revert ZeroAddress();
        if (_parentNode == bytes32(0)) revert EmptyLabel();
        if (_owner == address(0)) revert ZeroAddress();

        registry = _registry;
        resolver = _resolver;
        rifToken = _rifToken;
        parentNode = _parentNode;
        pricePerSubdomain = _initialPrice;
    }

    function setPrice(uint256 newPrice) external onlyOwner {
        uint256 oldPrice = pricePerSubdomain;
        pricePerSubdomain = newPrice;
        emit PriceUpdated(oldPrice, newPrice);
    }

    function setResolver(IRNSResolver newResolver) external onlyOwner {
        require(address(newResolver) != address(0), "SVM: resolver is zero");
        address old = address(resolver);
        resolver = newResolver;
        emit ResolverUpdated(old, address(newResolver));
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function withdraw(address to, uint256 amount) external onlyOwner nonReentrant {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert AmountZero();

        uint256 balance = rifToken.balanceOf(address(this));
        if (amount > balance) revert InsufficientBalance();

        rifToken.safeTransfer(to, amount);

        emit FundsWithdrawn(to, amount);
    }

    function reclaimParentNode(address to) external onlyOwner whenPaused {
        if (to == address(0)) revert ZeroAddress();
        registry.setOwner(parentNode, to);
        emit ParentNodeReclaimed(to);
    }

    function isAvailable(string calldata label) external view returns (bool) {
        bytes32 labelhash = _labelhash(label);
        bytes32 subnode = _subnode(labelhash);
        return registry.owner(subnode) == address(0);
    }

    function register(string calldata label, address owner_)
        external
        nonReentrant
        whenNotPaused
    {
        if (owner_ == address(0)) revert ZeroAddress();

        if (registry.owner(parentNode) != address(this)) revert NotParentOwner();

        bytes32 labelhash = _labelhash(label);
        bytes32 subnode = _subnode(labelhash);

        if (registry.owner(subnode) != address(0)) revert AlreadyRegistered();

        uint256 price = pricePerSubdomain;
        if (price > 0) {
            rifToken.safeTransferFrom(msg.sender, address(this), price);
        }

        registry.setSubnodeOwner(parentNode, labelhash, address(this));

        registry.setResolver(subnode, address(resolver));

        registry.setOwner(subnode, owner_);

        emit SubdomainRegistered(parentNode, labelhash, owner_, price);
    }

    function subnodeOf(string calldata label) external view returns (bytes32) {
        bytes32 labelhash = _labelhash(label);
        return _subnode(labelhash);
    }

    function _labelhash(string calldata label) private pure returns (bytes32) {
        if (bytes(label).length == 0) revert EmptyLabel();
        return keccak256(abi.encodePacked(label));
    }

    function _subnode(bytes32 labelhash) private view returns (bytes32) {
        return keccak256(abi.encodePacked(parentNode, labelhash));
    }
}

