import { expect } from 'chai';
import { defaultSender, provider, web3, contract } from '@openzeppelin/test-environment';
import { signDaiPermit, signERC2612Permit } from '../src/eth-permit';
import { setChainIdOverride } from '../src/rpc';

const spender = '0x0000000000000000000000000000000000000002';
const MAX_INT = web3.utils.hexToNumberString('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

describe('ETH permit', () => {
  it('can call permit on Dai', async () => {
    const TestDai = contract.fromArtifact('TestDai');
    const dai = await TestDai.deploy().send();

    setChainIdOverride(1); // https://github.com/trufflesuite/ganache-core/issues/515

    const result = await signDaiPermit(provider, dai._address, defaultSender, spender);
    
    await dai.methods.permit(defaultSender, spender, result.nonce, result.expiry, true, result.v, result.r, result.s).send({
      from: defaultSender,
    });

    expect(await dai.methods.allowance(defaultSender, spender).call()).to.equal(MAX_INT);
  });

  it('can call permit on an ERC2612', async () => {
    const TestERC2612 = contract.fromArtifact('TestERC2612');
    const token = await TestERC2612.deploy().send();

    setChainIdOverride(1); // https://github.com/trufflesuite/ganache-core/issues/515

    const value = '1000000000000000000';

    const result = await signERC2612Permit(provider, token._address, defaultSender, spender, value);

    await token.methods.permit(defaultSender, spender, value, result.deadline, result.v, result.r, result.s).send({
      from: defaultSender,
    });

    expect(await token.methods.allowance(defaultSender, spender).call()).to.equal(value);
  });
});
