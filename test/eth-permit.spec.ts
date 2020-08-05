import { defaultSender, provider, web3, contract } from '@openzeppelin/test-environment';
import { signDaiPermit } from '../src/eth-permit';
import { setChainIdOverride } from '../src/rpc';

const spender = '0x0000000000000000000000000000000000000002';

describe('ETH permit', () => {
  it('can call permit on Dai', async () => {
    const TestDai = contract.fromArtifact('TestDai');
    const dai = await TestDai.deploy().send();

    setChainIdOverride(1); // https://github.com/trufflesuite/ganache-core/issues/515

    const result = await signDaiPermit(provider, dai._address, defaultSender, spender);
    
    await dai.methods.permit(defaultSender, spender, result.nonce, result.expiry, true, result.v, result.r, result.s).send({
      from: defaultSender,
    });
  });
});
