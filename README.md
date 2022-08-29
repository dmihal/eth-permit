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

### Special consideration when running on test networks

There are setups with dev test networks that fork from the mainnet.  While this type of setup has a lot of benefits, it can make some of the interactions difficult.  Take, for instance, the DAI deployment on the mainnet.  Best practices for utilizing signatures is to include a DOMAIN_SEPARATOR that includes the chainId.  When DAI was deployed on the mainnet, part of the DOMAIN_SEPARATOR set the chainId to 1.  If you are interacting with that contract on your fork you need to generate a signature with the chainId value set to 1 and then send the transaction with a provider connected to your test netowrk which may have a chainId of 31337 in the case of hardhat.

If all the information (such as nonce and expiry) is not provided to the signDaiPermit or signERC2512Permit functions then queries are made to determine information with the forked chainId so you would need the provider to have the forked chainId.  However, a provider that has the mainnet chainId is required to sign the message.  Therefor, all information should be passed to the functions and not left to defaults.

```javascript
import { signDaiPermit } from 'eth-permit';

const max_int = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

const value = web3.utils.toWei('1', 'ether');

const wallet = new ethers.Wallet(privateKey, new ethers.providers.JsonRpcProvider(rpcUrl));
const senderAddress = await wallet.getAddress();

// find the correct nonce to use with a query to the test network
const nonce = await token.methods.nonces(senderAddress).send({
  from: senderAddress,
});

// create a wallet that will use a mainnet chainId for its provider but does not connect to anything
// it will use the ethers.js _signTypedData to create the signature and not a wallet provider
let mainnetWallet = new ethers.Wallet(privateKey, ethers.getDefaultProvider());

let domain = {
        "name": "Dai Stablecoin",
        "version": "1",
        "chainId": 1,
        "verifyingContract": tokenAddress
    }

const result = await signDaiPermit(mainnetWallet, domain, senderAddress, spender, max_int, nonce);

await token.methods.permit(senderAddress, spender, result.nonce, result.expiry, true, result.v, result.r, result.s).send({
  from: senderAddress,
});
```
