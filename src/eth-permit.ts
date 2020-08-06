import { getChainId, call, signData, RSV } from './rpc';
import { hexToUtf8 } from './lib';

const MAX_INT = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

interface DaiPermitMessage {
  holder: string;
  spender: string;
  nonce: number;
  expiry: number | string;
  allowed?: boolean;
}

interface ERC2612PermitMessage {
  owner: string;
  spender: string;
  value: number | string;
  nonce: number | string;
  deadline: number | string;
}

interface Domain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: string;
}

const EIP712Domain = [
  { name: "name", type: "string" },
  { name: "version", type: "string" },
  { name: "chainId", type: "uint256" },
  { name: "verifyingContract", type: "address" },
];

const createTypedDaiData = (message: DaiPermitMessage, domain: Domain) => {
  const typedData = {
    types: {
      EIP712Domain,
      Permit: [
        { name: "holder", type: "address" },
        { name: "spender", type: "address" },
        { name: "nonce", type: "uint256" },
        { name: "expiry", type: "uint256" },
        { name: "allowed", type: "bool" },
      ],
    },
    primaryType: "Permit",
    domain,
    message,
  };

  return typedData;
};

const createTypedERC2612Data = (message: ERC2612PermitMessage, domain: Domain) => {
  const typedData = {
    types: {
      EIP712Domain,
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    },
    primaryType: "Permit",
    domain,
    message,
  };

  return typedData;
};

const NONCES_FN = '0x7ecebe00';
const NAME_FN = '0x06fdde03';

const zeros = (numZeros: number) => ''.padEnd(numZeros, '0');

const getTokenName = async (provider: any, address: string) =>
  hexToUtf8((await call(provider, address, NAME_FN)).substr(130));


const getDomain = async (provider: any, token: string | Domain): Promise<Domain> => {
  if (typeof token !== 'string') {
    return token as Domain;
  }

  const tokenAddress = token as string;

  const [name, chainId] = await Promise.all([
    getTokenName(provider, tokenAddress),
    getChainId(provider),
  ]);

  const domain: Domain = { name, version: '1', chainId, verifyingContract: tokenAddress };
  return domain;
};

export const signDaiPermit = async (
  provider: any,
  token: string | Domain,
  holder: string,
  spender: string,
  expiry?: number,
  nonce?: number,
): Promise<DaiPermitMessage & RSV> => {
  const tokenAddress = (token as Domain).verifyingContract || token as string;

  const message: DaiPermitMessage = {
    holder,
    spender,
    nonce: nonce || await call(provider, tokenAddress, `${NONCES_FN}${zeros(24)}${holder.substr(2)}`),
    expiry: expiry || MAX_INT,
    allowed: true,
  };

  const domain = await getDomain(provider, token);
  const typedData = createTypedDaiData(message, domain);
  const sig = await signData(provider, holder, typedData);

  return { ...sig, ...message };
};

export const signERC2612Permit = async (
  provider: any,
  token: string | Domain,
  owner: string,
  spender: string,
  value: string | number = MAX_INT,
  deadline?: number,
  nonce?: number,
): Promise<ERC2612PermitMessage & RSV> => {
  const tokenAddress = (token as Domain).verifyingContract || token as string;

  const message: ERC2612PermitMessage = {
    owner,
    spender,
    value,
    nonce: nonce || await call(provider, tokenAddress, `${NONCES_FN}${zeros(24)}${owner.substr(2)}`),
    deadline: deadline || MAX_INT,
  };

  const domain = await getDomain(provider, token);
  const typedData = createTypedERC2612Data(message, domain);
  const sig = await signData(provider, owner, typedData);

  return { ...sig, ...message };
};
