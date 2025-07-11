import type { Compute } from '../types/type-utils';

export enum TRIGGER_TYPES {
  FEATURES_ANNOUNCEMENT = 'features_announcement',
  METAMASK_SWAP_COMPLETED = 'metamask_swap_completed',
  ERC20_SENT = 'erc20_sent',
  ERC20_RECEIVED = 'erc20_received',
  ETH_SENT = 'eth_sent',
  ETH_RECEIVED = 'eth_received',
  ROCKETPOOL_STAKE_COMPLETED = 'rocketpool_stake_completed',
  ROCKETPOOL_UNSTAKE_COMPLETED = 'rocketpool_unstake_completed',
  LIDO_STAKE_COMPLETED = 'lido_stake_completed',
  LIDO_WITHDRAWAL_REQUESTED = 'lido_withdrawal_requested',
  LIDO_WITHDRAWAL_COMPLETED = 'lido_withdrawal_completed',
  LIDO_STAKE_READY_TO_BE_WITHDRAWN = 'lido_stake_ready_to_be_withdrawn',
  ERC721_SENT = 'erc721_sent',
  ERC721_RECEIVED = 'erc721_received',
  ERC1155_SENT = 'erc1155_sent',
  ERC1155_RECEIVED = 'erc1155_received',
  AAVE_V3_HEALTH_FACTOR = 'aave_v3_health_factor',
  ENS_EXPIRATION = 'ens_expiration',
  LIDO_STAKING_REWARDS = 'lido_staking_rewards',
  ROCKETPOOL_STAKING_REWARDS = 'rocketpool_staking_rewards',
  NOTIONAL_LOAN_EXPIRATION = 'notional_loan_expiration',
  SPARK_FI_HEALTH_FACTOR = 'spark_fi_health_factor',
  SNAP = 'snap',
}

export const TRIGGER_TYPES_WALLET_SET: Set<string> = new Set([
  TRIGGER_TYPES.METAMASK_SWAP_COMPLETED,
  TRIGGER_TYPES.ERC20_SENT,
  TRIGGER_TYPES.ERC20_RECEIVED,
  TRIGGER_TYPES.ETH_SENT,
  TRIGGER_TYPES.ETH_RECEIVED,
  TRIGGER_TYPES.ROCKETPOOL_STAKE_COMPLETED,
  TRIGGER_TYPES.ROCKETPOOL_UNSTAKE_COMPLETED,
  TRIGGER_TYPES.LIDO_STAKE_COMPLETED,
  TRIGGER_TYPES.LIDO_WITHDRAWAL_REQUESTED,
  TRIGGER_TYPES.LIDO_WITHDRAWAL_COMPLETED,
  TRIGGER_TYPES.LIDO_STAKE_READY_TO_BE_WITHDRAWN,
  TRIGGER_TYPES.ERC721_SENT,
  TRIGGER_TYPES.ERC721_RECEIVED,
  TRIGGER_TYPES.ERC1155_SENT,
  TRIGGER_TYPES.ERC1155_RECEIVED,
]) satisfies Set<Exclude<TRIGGER_TYPES, TRIGGER_TYPES.FEATURES_ANNOUNCEMENT>>;

export enum TRIGGER_TYPES_GROUPS {
  RECEIVED = 'received',
  SENT = 'sent',
  DEFI = 'defi',
}

export const NOTIFICATION_CHAINS_ID = {
  ETHEREUM: '1',
  OPTIMISM: '10',
  BSC: '56',
  POLYGON: '137',
  ARBITRUM: '42161',
  AVALANCHE: '43114',
  LINEA: '59144',
  SEI: '1329',
} as const;

type ToPrimitiveKeys<TObj> = Compute<{
  [K in keyof TObj]: TObj[K] extends string ? string : TObj[K];
}>;
export const NOTIFICATION_CHAINS: ToPrimitiveKeys<
  typeof NOTIFICATION_CHAINS_ID
> = NOTIFICATION_CHAINS_ID;

export const CHAIN_SYMBOLS = {
  [NOTIFICATION_CHAINS.ETHEREUM]: 'ETH',
  [NOTIFICATION_CHAINS.OPTIMISM]: 'ETH',
  [NOTIFICATION_CHAINS.BSC]: 'BNB',
  [NOTIFICATION_CHAINS.POLYGON]: 'POL',
  [NOTIFICATION_CHAINS.ARBITRUM]: 'ETH',
  [NOTIFICATION_CHAINS.AVALANCHE]: 'AVAX',
  [NOTIFICATION_CHAINS.LINEA]: 'ETH',
};

export const SUPPORTED_CHAINS = [
  NOTIFICATION_CHAINS.ETHEREUM,
  NOTIFICATION_CHAINS.OPTIMISM,
  NOTIFICATION_CHAINS.BSC,
  NOTIFICATION_CHAINS.POLYGON,
  NOTIFICATION_CHAINS.ARBITRUM,
  NOTIFICATION_CHAINS.AVALANCHE,
  NOTIFICATION_CHAINS.LINEA,
];

export type Trigger = {
  supported_chains: (typeof SUPPORTED_CHAINS)[number][];
};

export const TRIGGERS: Partial<Record<TRIGGER_TYPES, Trigger>> = {
  [TRIGGER_TYPES.METAMASK_SWAP_COMPLETED]: {
    supported_chains: [
      NOTIFICATION_CHAINS.ETHEREUM,
      NOTIFICATION_CHAINS.OPTIMISM,
      NOTIFICATION_CHAINS.BSC,
      NOTIFICATION_CHAINS.POLYGON,
      NOTIFICATION_CHAINS.ARBITRUM,
      NOTIFICATION_CHAINS.AVALANCHE,
    ],
  },
  [TRIGGER_TYPES.ERC20_SENT]: {
    supported_chains: [
      NOTIFICATION_CHAINS.ETHEREUM,
      NOTIFICATION_CHAINS.OPTIMISM,
      NOTIFICATION_CHAINS.BSC,
      NOTIFICATION_CHAINS.POLYGON,
      NOTIFICATION_CHAINS.ARBITRUM,
      NOTIFICATION_CHAINS.AVALANCHE,
      NOTIFICATION_CHAINS.LINEA,
    ],
  },
  [TRIGGER_TYPES.ERC20_RECEIVED]: {
    supported_chains: [
      NOTIFICATION_CHAINS.ETHEREUM,
      NOTIFICATION_CHAINS.OPTIMISM,
      NOTIFICATION_CHAINS.BSC,
      NOTIFICATION_CHAINS.POLYGON,
      NOTIFICATION_CHAINS.ARBITRUM,
      NOTIFICATION_CHAINS.AVALANCHE,
      NOTIFICATION_CHAINS.LINEA,
    ],
  },
  [TRIGGER_TYPES.ERC721_SENT]: {
    supported_chains: [
      NOTIFICATION_CHAINS.ETHEREUM,
      NOTIFICATION_CHAINS.POLYGON,
    ],
  },
  [TRIGGER_TYPES.ERC721_RECEIVED]: {
    supported_chains: [
      NOTIFICATION_CHAINS.ETHEREUM,
      NOTIFICATION_CHAINS.POLYGON,
    ],
  },
  [TRIGGER_TYPES.ERC1155_SENT]: {
    supported_chains: [
      NOTIFICATION_CHAINS.ETHEREUM,
      NOTIFICATION_CHAINS.POLYGON,
    ],
  },
  [TRIGGER_TYPES.ERC1155_RECEIVED]: {
    supported_chains: [
      NOTIFICATION_CHAINS.ETHEREUM,
      NOTIFICATION_CHAINS.POLYGON,
    ],
  },
  [TRIGGER_TYPES.ETH_SENT]: {
    supported_chains: [
      NOTIFICATION_CHAINS.ETHEREUM,
      NOTIFICATION_CHAINS.OPTIMISM,
      NOTIFICATION_CHAINS.BSC,
      NOTIFICATION_CHAINS.POLYGON,
      NOTIFICATION_CHAINS.ARBITRUM,
      NOTIFICATION_CHAINS.AVALANCHE,
      NOTIFICATION_CHAINS.LINEA,
    ],
  },
  [TRIGGER_TYPES.ETH_RECEIVED]: {
    supported_chains: [
      NOTIFICATION_CHAINS.ETHEREUM,
      NOTIFICATION_CHAINS.OPTIMISM,
      NOTIFICATION_CHAINS.BSC,
      NOTIFICATION_CHAINS.POLYGON,
      NOTIFICATION_CHAINS.ARBITRUM,
      NOTIFICATION_CHAINS.AVALANCHE,
      NOTIFICATION_CHAINS.LINEA,
    ],
  },
  [TRIGGER_TYPES.ROCKETPOOL_STAKE_COMPLETED]: {
    supported_chains: [NOTIFICATION_CHAINS.ETHEREUM],
  },
  [TRIGGER_TYPES.ROCKETPOOL_UNSTAKE_COMPLETED]: {
    supported_chains: [NOTIFICATION_CHAINS.ETHEREUM],
  },
  [TRIGGER_TYPES.LIDO_STAKE_COMPLETED]: {
    supported_chains: [NOTIFICATION_CHAINS.ETHEREUM],
  },
  [TRIGGER_TYPES.LIDO_WITHDRAWAL_REQUESTED]: {
    supported_chains: [NOTIFICATION_CHAINS.ETHEREUM],
  },
  [TRIGGER_TYPES.LIDO_WITHDRAWAL_COMPLETED]: {
    supported_chains: [NOTIFICATION_CHAINS.ETHEREUM],
  },
};
