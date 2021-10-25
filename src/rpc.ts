const randomId = () => Math.floor(Math.random() * 10000000000);

export const send = (provider: any, method: string, params?: any[]) => new Promise<any>((resolve, reject) => {
  const payload = {
    id: randomId(),
    method,
    params,
  };
  const callback = (err: any, result: any) => {
    if (err) {
      reject(err);
    } else if (result.error) {
      console.error(result.error);
      reject(result.error);
    } else {
      resolve(result.result);
    }
  };

  const _provider = provider.provider?.provider || provider.provider || provider

  if (_provider.getUncheckedSigner /* ethers provider */) {
    _provider
      .send(method, params)
      .then((r: any) => resolve(r))
      .catch((e: any) => reject(e));
  } else if (_provider.sendAsync) {
    _provider.sendAsync(payload, callback);
  } else {
    _provider.send(payload, callback).catch((error: any) => {
      if (
        error.message ===
        "Hardhat Network doesn't support JSON-RPC params sent as an object"
      ) {
        _provider
          .send(method, params)
          .then((r: any) => resolve(r))
          .catch((e: any) => reject(e));
      } else {
        throw error;
      }
    });
  }
});

export interface RSV {
  r: string;
  s: string;
  v: number;
}

const splitSignatureToRSV = (signature: string): RSV => {
  const r = '0x' + signature.substring(2).substring(0, 64);
  const s = '0x' + signature.substring(2).substring(64, 128);
  const v = parseInt(signature.substring(2).substring(128, 130), 16);
  return { r, s, v };
}

const signWithEthers = async (signer: any, fromAddress: string, typeData: any): Promise<RSV> => {
  const signerAddress = await signer.getAddress();
  if (signerAddress.toLowerCase() !== fromAddress.toLowerCase()) {
    throw new Error('Signer address does not match requested signing address');
  }

  const { EIP712Domain: _unused, ...types } = typeData.types;
  const rawSignature = await (signer.signTypedData
    ? signer.signTypedData(typeData.domain, types, typeData.message)
    : signer._signTypedData(typeData.domain, types, typeData.message));

  return splitSignatureToRSV(rawSignature);
}

export const signData = async (provider: any, fromAddress: string, typeData: any): Promise<RSV> => {
  if (provider._signTypedData || provider.signTypedData) {
    return signWithEthers(provider, fromAddress, typeData);
  }

  const typeDataString = typeof typeData === 'string' ? typeData : JSON.stringify(typeData);
  const result = await send(provider, 'eth_signTypedData_v4', [fromAddress, typeDataString])
    .catch((error: any) => {
      if (error.message === 'Method eth_signTypedData_v4 not supported.') {
        return send(provider, 'eth_signTypedData', [fromAddress, typeData]);
      } else {
        throw error;
      }
    });

  return {
    r: result.slice(0, 66),
    s: '0x' + result.slice(66, 130),
    v: parseInt(result.slice(130, 132), 16),
  };
};

let chainIdOverride: null | number = null;
export const setChainIdOverride = (id: number) => { chainIdOverride = id };
export const getChainId = async (provider: any): Promise<any> => chainIdOverride || send(provider, 'eth_chainId');

export const call = (provider: any, to: string, data: string) => send(provider, 'eth_call', [{
  to,
  data,
}, 'latest']);
