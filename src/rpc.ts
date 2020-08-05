const randomId = () => Math.floor(Math.random() * 10000000000);

export const send = (provider: any, method: string, params?: any[]) => new Promise<any>((resolve, reject) =>
  provider.sendAsync({
    id: randomId(),
    method,
    params,
  }, (err: any, result: any) => {
    if (err) {
      reject(err);
    } else {
      resolve(result);
    }
  }));

export interface RSV {
  r: string;
  s: string;
  v: number;
}

export const signData = async (provider: any, fromAddress: string, typeData: string): Promise<RSV> => {
  const result = await send(provider, 'eth_signTypedData_v3', [fromAddress, typeData]);

  return {
    r: result.result.slice(0, 66),
    s: '0x' + result.result.slice(66, 130),
    v: parseInt(result.result.slice(130, 132), 16),
  };
};

export const chainId = (provider: any) => send(provider, 'eth_chainId');

export const call = (provider: any, to: string, data: string) => send(provider, 'eth_call', [{
  to,
  data,
}, 'latest']);
