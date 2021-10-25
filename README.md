# eth-permit

This package simplifies the process of signing `permit` messages for Ethereum tokens.

## What is permit?

Permit is a technique for metatransaction token transfers. Using permit can allow a contract
to use a user's tokens without the user first needing to first to send an `approve()` transaction.

## Permit variations

Permit was first introduced in the Multi-Collateral Dai token contract.

The permit technique is being standardized as part of [ERC-2612](https://github.com/ethereum/EIPs/issues/2613).
This standard (which has already been implemented in projects like Uniswap V2) is slightly
different than the implementation used by Dai. Therefore, this library provides functions
for signing both types of messages.

## Usage

Install the package `eth-permit` using npm or yarn.

### Dai-style permits

```javascript
import { signDaiPermit } from 'eth-permit';

// Sign message using injected provider (ie Metamask).
// You can replace window.ethereum with any other web3 provider.
const result = await signDaiPermit(window.ethereum, tokenAddress, senderAddress, spender);

await token.methods.permit(senderAddress, spender, result.nonce, result.expiry, true, result.v, result.r, result.s).send({
  from: senderAddress,
});
```

### ERC2612-style permits

```javascript
import { signERC2612Permit } from 'eth-permit';

const value = web3.utils.toWei('1', 'ether');

// Sign message using injected provider (ie Metamask).
// You can replace window.ethereum with any other web3 provider.
const result = await signERC2612Permit(window.ethereum, tokenAddress, senderAddress, spender, value);

await token.methods.permit(senderAddress, spender, value, result.deadline, result.v, result.r, result.s).send({
  from: senderAddress,
});
```

### Ethers Wallet support

The library now supports Ethers.js Wallet signers:

```javascript
import { signERC2612Permit } from 'eth-permit';

const value = web3.utils.toWei('1', 'ether');

const wallet = new ethers.Wallet(privateKey, new ethers.providers.JsonRpcProvider(rpcUrl));
const senderAddress = await wallet.getAddress();

const result = await signERC2612Permit(wallet, tokenAddress, senderAddress, spender, value);

await token.methods.permit(senderAddress, spender, value, result.deadline, result.v, result.r, result.s).send({
  from: senderAddress,
});
```
