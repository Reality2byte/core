import type { TypedTransaction } from '@ethereumjs/tx';
import type {
  AccountsControllerGetSelectedAccountAction,
  AccountsControllerGetStateAction,
} from '@metamask/accounts-controller';
import type {
  AcceptResultCallbacks,
  AddApprovalRequest,
  AddResult,
} from '@metamask/approval-controller';
import type {
  ControllerGetStateAction,
  ControllerStateChangeEvent,
  RestrictedMessenger,
} from '@metamask/base-controller';
import { BaseController } from '@metamask/base-controller';
import {
  query,
  ApprovalType,
  ORIGIN_METAMASK,
  convertHexToDecimal,
} from '@metamask/controller-utils';
import type { TraceCallback, TraceContext } from '@metamask/controller-utils';
import EthQuery from '@metamask/eth-query';
import type {
  FetchGasFeeEstimateOptions,
  GasFeeState,
} from '@metamask/gas-fee-controller';
import type { KeyringControllerSignEip7702AuthorizationAction } from '@metamask/keyring-controller';
import type {
  BlockTracker,
  NetworkClientId,
  NetworkController,
  NetworkControllerStateChangeEvent,
  NetworkState,
  Provider,
  NetworkControllerFindNetworkClientIdByChainIdAction,
  NetworkControllerGetNetworkClientByIdAction,
} from '@metamask/network-controller';
import { NetworkClientType } from '@metamask/network-controller';
import type {
  NonceLock,
  Transaction as NonceTrackerTransaction,
} from '@metamask/nonce-tracker';
import { NonceTracker } from '@metamask/nonce-tracker';
import type { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import {
  errorCodes,
  rpcErrors,
  providerErrors,
  JsonRpcError,
} from '@metamask/rpc-errors';
import type { Hex, Json } from '@metamask/utils';
import { add0x, hexToNumber } from '@metamask/utils';
// This package purposefully relies on Node's EventEmitter module.
// eslint-disable-next-line import-x/no-nodejs-modules
import { EventEmitter } from 'events';
import { cloneDeep, mapValues, merge, pickBy, sortBy } from 'lodash';
import { v1 as random } from 'uuid';

import {
  getAccountAddressRelationship,
  type GetAccountAddressRelationshipRequest,
} from './api/accounts-api';
import { DefaultGasFeeFlow } from './gas-flows/DefaultGasFeeFlow';
import { LineaGasFeeFlow } from './gas-flows/LineaGasFeeFlow';
import { OptimismLayer1GasFeeFlow } from './gas-flows/OptimismLayer1GasFeeFlow';
import { RandomisedEstimationsGasFeeFlow } from './gas-flows/RandomisedEstimationsGasFeeFlow';
import { ScrollLayer1GasFeeFlow } from './gas-flows/ScrollLayer1GasFeeFlow';
import { TestGasFeeFlow } from './gas-flows/TestGasFeeFlow';
import { AccountsApiRemoteTransactionSource } from './helpers/AccountsApiRemoteTransactionSource';
import {
  GasFeePoller,
  updateTransactionGasProperties,
  updateTransactionGasEstimates,
} from './helpers/GasFeePoller';
import type { IncomingTransactionOptions } from './helpers/IncomingTransactionHelper';
import { IncomingTransactionHelper } from './helpers/IncomingTransactionHelper';
import { MethodDataHelper } from './helpers/MethodDataHelper';
import { MultichainTrackingHelper } from './helpers/MultichainTrackingHelper';
import { PendingTransactionTracker } from './helpers/PendingTransactionTracker';
import type { ResimulateResponse } from './helpers/ResimulateHelper';
import {
  ResimulateHelper,
  hasSimulationDataChanged,
  shouldResimulate,
} from './helpers/ResimulateHelper';
import { ExtraTransactionsPublishHook } from './hooks/ExtraTransactionsPublishHook';
import { projectLogger as log } from './logger';
import type {
  DappSuggestedGasFees,
  Layer1GasFeeFlow,
  SavedGasFees,
  SecurityProviderRequest,
  SendFlowHistoryEntry,
  TransactionParams,
  TransactionMeta,
  TransactionReceipt,
  WalletDevice,
  SecurityAlertResponse,
  GasFeeFlow,
  SimulationData,
  GasFeeEstimates,
  GasFeeFlowResponse,
  GasPriceValue,
  FeeMarketEIP1559Values,
  SubmitHistoryEntry,
  TransactionBatchRequest,
  TransactionBatchResult,
  BatchTransactionParams,
  UpdateCustodialTransactionRequest,
  PublishHook,
  PublishBatchHook,
  GasFeeToken,
  IsAtomicBatchSupportedResult,
  IsAtomicBatchSupportedRequest,
  AfterAddHook,
  GasFeeEstimateLevel as GasFeeEstimateLevelType,
  TransactionBatchMeta,
  AfterSimulateHook,
  BeforeSignHook,
  TransactionContainerType,
  NestedTransactionMetadata,
} from './types';
import {
  GasFeeEstimateLevel,
  TransactionEnvelopeType,
  TransactionType,
  TransactionStatus,
  SimulationErrorCode,
} from './types';
import { getBalanceChanges } from './utils/balance-changes';
import { addTransactionBatch, isAtomicBatchSupported } from './utils/batch';
import {
  generateEIP7702BatchTransaction,
  getDelegationAddress,
  signAuthorizationList,
} from './utils/eip7702';
import { validateConfirmedExternalTransaction } from './utils/external-transactions';
import { addGasBuffer, estimateGas, updateGas } from './utils/gas';
import { getGasFeeTokens } from './utils/gas-fee-tokens';
import { updateGasFees } from './utils/gas-fees';
import { getGasFeeFlow } from './utils/gas-flow';
import {
  addInitialHistorySnapshot,
  updateTransactionHistory,
} from './utils/history';
import {
  getTransactionLayer1GasFee,
  updateTransactionLayer1GasFee,
} from './utils/layer1-gas-fee-flow';
import {
  getAndFormatTransactionsForNonceTracker,
  getNextNonce,
} from './utils/nonce';
import { prepareTransaction, serializeTransaction } from './utils/prepare';
import { getTransactionParamsWithIncreasedGasFee } from './utils/retry';
import {
  updatePostTransactionBalance,
  updateSwapsTransaction,
} from './utils/swaps';
import { determineTransactionType } from './utils/transaction-type';
import {
  normalizeTransactionParams,
  isEIP1559Transaction,
  validateGasValues,
  validateIfTransactionUnapproved,
  normalizeTxError,
  normalizeGasFeeValues,
  setEnvelopeType,
} from './utils/utils';
import {
  ErrorCode,
  validateParamTo,
  validateTransactionOrigin,
  validateTxParams,
} from './utils/validation';

/**
 * Metadata for the TransactionController state, describing how to "anonymize"
 * the state and which parts should be persisted.
 */
const metadata = {
  transactions: {
    persist: true,
    anonymous: false,
  },
  transactionBatches: {
    persist: true,
    anonymous: false,
  },
  methodData: {
    persist: true,
    anonymous: false,
  },
  lastFetchedBlockNumbers: {
    persist: true,
    anonymous: false,
  },
  submitHistory: {
    persist: true,
    anonymous: false,
  },
};

const SUBMIT_HISTORY_LIMIT = 100;

/**
 * Object with new transaction's meta and a promise resolving to the
 * transaction hash if successful.
 */
// This interface was created before this ESLint rule was added.
// Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface Result {
  /** Promise resolving to a new transaction hash. */
  result: Promise<string>;

  /** Meta information about this new transaction. */
  transactionMeta: TransactionMeta;
}

/**
 * Method data registry object
 */
export type MethodData = {
  /** Registry method raw string. */
  registryMethod: string;

  /** Registry method object, containing name and method arguments. */
  parsedRegistryMethod:
    | {
        name: string;
        args: { type: string }[];
      }
    | {
        // We're using `any` instead of `undefined` for compatibility with `Json`
        // TODO: Correct this type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        name?: any;
        // We're using `any` instead of `undefined` for compatibility with `Json`
        // TODO: Correct this type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        args?: any;
      };
};

/**
 * Transaction controller state
 */
export type TransactionControllerState = {
  /** A list of TransactionMeta objects. */
  transactions: TransactionMeta[];

  /** A list of TransactionBatchMeta objects. */
  transactionBatches: TransactionBatchMeta[];

  /** Object containing all known method data information. */
  methodData: Record<string, MethodData>;

  /** Cache to optimise incoming transaction queries. */
  lastFetchedBlockNumbers: { [key: string]: number | string };

  /** History of all transactions submitted from the wallet. */
  submitHistory: SubmitHistoryEntry[];
};

/**
 * Multiplier used to determine a transaction's increased gas fee during cancellation
 */
export const CANCEL_RATE = 1.1;

/**
 * Multiplier used to determine a transaction's increased gas fee during speed up
 */
export const SPEED_UP_RATE = 1.1;

/**
 * Represents the `TransactionController:getState` action.
 */
export type TransactionControllerGetStateAction = ControllerGetStateAction<
  typeof controllerName,
  TransactionControllerState
>;

/**
 * Represents the `TransactionController:updateCustodialTransaction` action.
 */
export type TransactionControllerUpdateCustodialTransactionAction = {
  type: `${typeof controllerName}:updateCustodialTransaction`;
  handler: TransactionController['updateCustodialTransaction'];
};

export type TransactionControllerEstimateGasAction = {
  type: `${typeof controllerName}:estimateGas`;
  handler: TransactionController['estimateGas'];
};

/**
 * The internal actions available to the TransactionController.
 */
export type TransactionControllerActions =
  | TransactionControllerEstimateGasAction
  | TransactionControllerGetStateAction
  | TransactionControllerUpdateCustodialTransactionAction;

/**
 * Configuration options for the PendingTransactionTracker
 */
export type PendingTransactionOptions = {
  /** Whether transaction publishing is automatically retried. */
  isResubmitEnabled?: () => boolean;
};

/** TransactionController constructor options. */
export type TransactionControllerOptions = {
  /** Whether to disable storing history in transaction metadata. */
  disableHistory: boolean;

  /** Explicitly disable transaction metadata history. */
  disableSendFlowHistory: boolean;

  /** Whether to disable additional processing on swaps transactions. */
  disableSwaps: boolean;

  /** Whether or not the account supports EIP-1559. */
  getCurrentAccountEIP1559Compatibility?: () => Promise<boolean>;

  /** Whether or not the network supports EIP-1559. */
  getCurrentNetworkEIP1559Compatibility: () => Promise<boolean>;

  /** Callback to retrieve pending transactions from external sources. */
  getExternalPendingTransactions?: (
    address: string,
    chainId?: string,
  ) => NonceTrackerTransaction[];

  /** Callback to retrieve gas fee estimates. */
  getGasFeeEstimates?: (
    options: FetchGasFeeEstimateOptions,
  ) => Promise<GasFeeState>;

  /** Gets the network client registry. */
  getNetworkClientRegistry: NetworkController['getNetworkClientRegistry'];

  /** Gets the state of the network controller. */
  getNetworkState: () => NetworkState;

  /** Get accounts that a given origin has permissions for. */
  getPermittedAccounts?: (origin?: string) => Promise<string[]>;

  /** Gets the saved gas fee config. */
  getSavedGasFees?: (chainId: Hex) => SavedGasFees | undefined;

  /** Configuration options for incoming transaction support. */
  incomingTransactions?: IncomingTransactionOptions & {
    /** @deprecated Ignored as Etherscan no longer used. */
    etherscanApiKeysByChainId?: Record<Hex, string>;
  };

  /**
   * Callback to determine whether gas fee updates should be enabled for a given transaction.
   * Returns true to enable updates, false to disable them.
   */
  isAutomaticGasFeeUpdateEnabled?: (
    transactionMeta: TransactionMeta,
  ) => boolean;

  /** Whether simulation should return EIP-7702 gas fee tokens. */
  isEIP7702GasFeeTokensEnabled?: (
    transactionMeta: TransactionMeta,
  ) => Promise<boolean>;

  /** Whether the first time interaction check is enabled. */
  isFirstTimeInteractionEnabled?: () => boolean;

  /** Whether new transactions will be automatically simulated. */
  isSimulationEnabled?: () => boolean;

  /** The controller messenger. */
  messenger: TransactionControllerMessenger;

  /** Configuration options for pending transaction support. */
  pendingTransactions?: PendingTransactionOptions;

  /** Public key used to validate EIP-7702 contract signatures in feature flags. */
  publicKeyEIP7702?: Hex;

  /** A function for verifying a transaction, whether it is malicious or not. */
  securityProviderRequest?: SecurityProviderRequest;

  /** Function used to sign transactions. */
  sign?: (
    transaction: TypedTransaction,
    from: string,
    transactionMeta?: TransactionMeta,
  ) => Promise<TypedTransaction>;

  /** Initial state to set on this controller. */
  state?: Partial<TransactionControllerState>;

  testGasFeeFlows?: boolean;
  trace?: TraceCallback;

  /** Transaction history limit. */
  transactionHistoryLimit: number;

  /** The controller hooks. */
  hooks: {
    /** Additional logic to execute after adding a transaction. */
    afterAdd?: AfterAddHook;

    /** Additional logic to execute after signing a transaction. Return false to not change the status to signed. */
    afterSign?: (
      transactionMeta: TransactionMeta,
      signedTx: TypedTransaction,
    ) => boolean;

    /** Additional logic to execute after simulating a transaction. */
    afterSimulate?: AfterSimulateHook;

    /**
     * Additional logic to execute before checking pending transactions.
     * Return false to prevent the broadcast of the transaction.
     */
    beforeCheckPendingTransaction?: (
      transactionMeta: TransactionMeta,
    ) => Promise<boolean>;

    /**
     * Additional logic to execute before publishing a transaction.
     * Return false to prevent the broadcast of the transaction.
     */
    beforePublish?: (transactionMeta: TransactionMeta) => Promise<boolean>;

    /**
     * Additional logic to execute before signing a transaction.
     */
    beforeSign?: BeforeSignHook;

    /** Returns additional arguments required to sign a transaction. */
    getAdditionalSignArguments?: (
      transactionMeta: TransactionMeta,
    ) => (TransactionMeta | undefined)[];

    /** Alternate logic to publish a transaction. */
    publish?: (
      transactionMeta: TransactionMeta,
    ) => Promise<{ transactionHash: string }>;
    publishBatch?: PublishBatchHook;
  };
};

/**
 * The name of the {@link TransactionController}.
 */
const controllerName = 'TransactionController';

/**
 * The external actions available to the {@link TransactionController}.
 */
export type AllowedActions =
  | AccountsControllerGetSelectedAccountAction
  | AccountsControllerGetStateAction
  | AddApprovalRequest
  | KeyringControllerSignEip7702AuthorizationAction
  | NetworkControllerFindNetworkClientIdByChainIdAction
  | NetworkControllerGetNetworkClientByIdAction
  | RemoteFeatureFlagControllerGetStateAction;

/**
 * The external events available to the {@link TransactionController}.
 */
export type AllowedEvents = NetworkControllerStateChangeEvent;

/**
 * Represents the `TransactionController:stateChange` event.
 */
export type TransactionControllerStateChangeEvent = ControllerStateChangeEvent<
  typeof controllerName,
  TransactionControllerState
>;

/**
 * Represents the `TransactionController:incomingTransactionsReceived` event.
 */
export type TransactionControllerIncomingTransactionsReceivedEvent = {
  type: `${typeof controllerName}:incomingTransactionsReceived`;
  payload: [incomingTransactions: TransactionMeta[]];
};

/**
 * Represents the `TransactionController:postTransactionBalanceUpdated` event.
 */
export type TransactionControllerPostTransactionBalanceUpdatedEvent = {
  type: `${typeof controllerName}:postTransactionBalanceUpdated`;
  payload: [
    {
      transactionMeta: TransactionMeta;
      approvalTransactionMeta?: TransactionMeta;
    },
  ];
};

/**
 * Represents the `TransactionController:speedUpTransactionAdded` event.
 */
export type TransactionControllerSpeedupTransactionAddedEvent = {
  type: `${typeof controllerName}:speedupTransactionAdded`;
  payload: [transactionMeta: TransactionMeta];
};

/**
 * Represents the `TransactionController:transactionApproved` event.
 */
export type TransactionControllerTransactionApprovedEvent = {
  type: `${typeof controllerName}:transactionApproved`;
  payload: [
    {
      transactionMeta: TransactionMeta;
      actionId?: string;
    },
  ];
};

/**
 * Represents the `TransactionController:transactionConfirmed` event.
 */
export type TransactionControllerTransactionConfirmedEvent = {
  type: `${typeof controllerName}:transactionConfirmed`;
  payload: [transactionMeta: TransactionMeta];
};

/**
 * Represents the `TransactionController:transactionDropped` event.
 */
export type TransactionControllerTransactionDroppedEvent = {
  type: `${typeof controllerName}:transactionDropped`;
  payload: [{ transactionMeta: TransactionMeta }];
};

/**
 * Represents the `TransactionController:transactionFailed` event.
 */
export type TransactionControllerTransactionFailedEvent = {
  type: `${typeof controllerName}:transactionFailed`;
  payload: [
    {
      actionId?: string;
      error: string;
      transactionMeta: TransactionMeta;
    },
  ];
};

/**
 * Represents the `TransactionController:transactionFinished` event.
 */
export type TransactionControllerTransactionFinishedEvent = {
  type: `${typeof controllerName}:transactionFinished`;
  payload: [transactionMeta: TransactionMeta];
};

/**
 * Represents the `TransactionController:transactionNewSwapApproval` event.
 */
export type TransactionControllerTransactionNewSwapApprovalEvent = {
  type: `${typeof controllerName}:transactionNewSwapApproval`;
  payload: [{ transactionMeta: TransactionMeta }];
};

/**
 * Represents the `TransactionController:transactionNewSwap` event.
 */
export type TransactionControllerTransactionNewSwapEvent = {
  type: `${typeof controllerName}:transactionNewSwap`;
  payload: [{ transactionMeta: TransactionMeta }];
};

/**
 * Represents the `TransactionController:transactionNewSwapApproval` event.
 */
export type TransactionControllerTransactionNewSwapAndSendEvent = {
  type: `${typeof controllerName}:transactionNewSwapAndSend`;
  payload: [{ transactionMeta: TransactionMeta }];
};

/**
 * Represents the `TransactionController:transactionPublishingSkipped` event.
 */
export type TransactionControllerTransactionPublishingSkipped = {
  type: `${typeof controllerName}:transactionPublishingSkipped`;
  payload: [transactionMeta: TransactionMeta];
};

/**
 * Represents the `TransactionController:transactionRejected` event.
 */
export type TransactionControllerTransactionRejectedEvent = {
  type: `${typeof controllerName}:transactionRejected`;
  payload: [
    {
      transactionMeta: TransactionMeta;
      actionId?: string;
    },
  ];
};

/**
 * Represents the `TransactionController:transactionStatusUpdated` event.
 */
export type TransactionControllerTransactionStatusUpdatedEvent = {
  type: `${typeof controllerName}:transactionStatusUpdated`;
  payload: [
    {
      transactionMeta: TransactionMeta;
    },
  ];
};

/**
 * Represents the `TransactionController:transactionSubmitted` event.
 */
export type TransactionControllerTransactionSubmittedEvent = {
  type: `${typeof controllerName}:transactionSubmitted`;
  payload: [
    {
      transactionMeta: TransactionMeta;
      actionId?: string;
    },
  ];
};

/**
 * Represents the `TransactionController:unapprovedTransactionAdded` event.
 */
export type TransactionControllerUnapprovedTransactionAddedEvent = {
  type: `${typeof controllerName}:unapprovedTransactionAdded`;
  payload: [transactionMeta: TransactionMeta];
};

/**
 * The internal events available to the {@link TransactionController}.
 */
export type TransactionControllerEvents =
  | TransactionControllerIncomingTransactionsReceivedEvent
  | TransactionControllerPostTransactionBalanceUpdatedEvent
  | TransactionControllerSpeedupTransactionAddedEvent
  | TransactionControllerStateChangeEvent
  | TransactionControllerTransactionApprovedEvent
  | TransactionControllerTransactionConfirmedEvent
  | TransactionControllerTransactionDroppedEvent
  | TransactionControllerTransactionFailedEvent
  | TransactionControllerTransactionFinishedEvent
  | TransactionControllerTransactionNewSwapApprovalEvent
  | TransactionControllerTransactionNewSwapEvent
  | TransactionControllerTransactionNewSwapAndSendEvent
  | TransactionControllerTransactionPublishingSkipped
  | TransactionControllerTransactionRejectedEvent
  | TransactionControllerTransactionStatusUpdatedEvent
  | TransactionControllerTransactionSubmittedEvent
  | TransactionControllerUnapprovedTransactionAddedEvent;

/**
 * The messenger of the {@link TransactionController}.
 */
export type TransactionControllerMessenger = RestrictedMessenger<
  typeof controllerName,
  TransactionControllerActions | AllowedActions,
  TransactionControllerEvents | AllowedEvents,
  AllowedActions['type'],
  AllowedEvents['type']
>;

/**
 * Possible states of the approve transaction step.
 */
export enum ApprovalState {
  Approved = 'approved',
  NotApproved = 'not-approved',
  SkippedViaBeforePublishHook = 'skipped-via-before-publish-hook',
}

/**
 * Get the default TransactionsController state.
 *
 * @returns The default TransactionsController state.
 */
function getDefaultTransactionControllerState(): TransactionControllerState {
  return {
    methodData: {},
    transactions: [],
    transactionBatches: [],
    lastFetchedBlockNumbers: {},
    submitHistory: [],
  };
}

/**
 * Controller responsible for submitting and managing transactions.
 */
export class TransactionController extends BaseController<
  typeof controllerName,
  TransactionControllerState,
  TransactionControllerMessenger
> {
  readonly #afterAdd: AfterAddHook;

  readonly #afterSign: (
    transactionMeta: TransactionMeta,
    signedTx: TypedTransaction,
  ) => boolean;

  readonly #afterSimulate: AfterSimulateHook;

  readonly #approvingTransactionIds: Set<string> = new Set();

  readonly #beforeCheckPendingTransaction: (
    transactionMeta: TransactionMeta,
  ) => Promise<boolean>;

  readonly #beforePublish: (
    transactionMeta: TransactionMeta,
  ) => Promise<boolean>;

  readonly #beforeSign: BeforeSignHook;

  readonly #gasFeeFlows: GasFeeFlow[];

  readonly #getAdditionalSignArguments: (
    transactionMeta: TransactionMeta,
  ) => (TransactionMeta | undefined)[];

  readonly #getCurrentAccountEIP1559Compatibility: () => Promise<boolean>;

  readonly #getCurrentNetworkEIP1559Compatibility: (
    networkClientId?: NetworkClientId,
  ) => Promise<boolean>;

  readonly #getExternalPendingTransactions: (
    address: string,
    chainId?: string,
  ) => NonceTrackerTransaction[];

  readonly #getGasFeeEstimates: (
    options: FetchGasFeeEstimateOptions,
  ) => Promise<GasFeeState>;

  readonly #getNetworkState: () => NetworkState;

  readonly #getPermittedAccounts?: (origin?: string) => Promise<string[]>;

  readonly #getSavedGasFees: (chainId: Hex) => SavedGasFees | undefined;

  readonly #incomingTransactionHelper: IncomingTransactionHelper;

  readonly #incomingTransactionOptions: IncomingTransactionOptions & {
    etherscanApiKeysByChainId?: Record<Hex, string>;
  };

  readonly #internalEvents = new EventEmitter();

  readonly #isAutomaticGasFeeUpdateEnabled: (
    transactionMeta: TransactionMeta,
  ) => boolean;

  readonly #isEIP7702GasFeeTokensEnabled: (
    transactionMeta: TransactionMeta,
  ) => Promise<boolean>;

  readonly #isFirstTimeInteractionEnabled: () => boolean;

  readonly #isHistoryDisabled: boolean;

  readonly #isSendFlowHistoryDisabled: boolean;

  readonly #isSimulationEnabled: () => boolean;

  readonly #isSwapsDisabled: boolean;

  readonly #layer1GasFeeFlows: Layer1GasFeeFlow[];

  readonly #methodDataHelper: MethodDataHelper;

  readonly #multichainTrackingHelper: MultichainTrackingHelper;

  readonly #pendingTransactionOptions: PendingTransactionOptions;

  readonly #publicKeyEIP7702?: Hex;

  readonly #publish: (
    transactionMeta: TransactionMeta,
    rawTx: string,
  ) => Promise<{ transactionHash?: string }>;

  readonly #publishBatchHook?: PublishBatchHook;

  readonly #securityProviderRequest?: SecurityProviderRequest;

  readonly #sign?: (
    transaction: TypedTransaction,
    from: string,
    transactionMeta?: TransactionMeta,
  ) => Promise<TypedTransaction>;

  readonly #signAbortCallbacks: Map<string, () => void> = new Map();

  readonly #skipSimulationTransactionIds: Set<string> = new Set();

  readonly #testGasFeeFlows: boolean;

  readonly #trace: TraceCallback;

  readonly #transactionHistoryLimit: number;

  /**
   * Constructs a TransactionController.
   *
   * @param options - The controller options.
   */
  constructor(options: TransactionControllerOptions) {
    const {
      disableHistory,
      disableSendFlowHistory,
      disableSwaps,
      getCurrentAccountEIP1559Compatibility,
      getCurrentNetworkEIP1559Compatibility,
      getExternalPendingTransactions,
      getGasFeeEstimates,
      getNetworkClientRegistry,
      getNetworkState,
      getPermittedAccounts,
      getSavedGasFees,
      hooks,
      incomingTransactions = {},
      isAutomaticGasFeeUpdateEnabled,
      isEIP7702GasFeeTokensEnabled,
      isFirstTimeInteractionEnabled,
      isSimulationEnabled,
      messenger,
      pendingTransactions = {},
      publicKeyEIP7702,
      securityProviderRequest,
      sign,
      state,
      testGasFeeFlows,
      trace,
      transactionHistoryLimit = 40,
    } = options;

    super({
      name: controllerName,
      metadata,
      messenger,
      state: {
        ...getDefaultTransactionControllerState(),
        ...state,
      },
    });

    this.messagingSystem = messenger;

    this.#afterAdd = hooks?.afterAdd ?? (() => Promise.resolve({}));
    this.#afterSign = hooks?.afterSign ?? (() => true);
    this.#afterSimulate = hooks?.afterSimulate ?? (() => Promise.resolve({}));
    this.#beforeCheckPendingTransaction =
      /* istanbul ignore next */
      hooks?.beforeCheckPendingTransaction ?? (() => Promise.resolve(true));
    this.#beforePublish = hooks?.beforePublish ?? (() => Promise.resolve(true));
    this.#beforeSign = hooks?.beforeSign ?? (() => Promise.resolve({}));
    this.#getAdditionalSignArguments =
      hooks?.getAdditionalSignArguments ?? (() => []);
    this.#getCurrentAccountEIP1559Compatibility =
      getCurrentAccountEIP1559Compatibility ?? (() => Promise.resolve(true));
    this.#getCurrentNetworkEIP1559Compatibility =
      getCurrentNetworkEIP1559Compatibility;
    this.#getExternalPendingTransactions =
      getExternalPendingTransactions ?? (() => []);
    this.#getGasFeeEstimates =
      getGasFeeEstimates || (() => Promise.resolve({} as GasFeeState));
    this.#getNetworkState = getNetworkState;
    this.#getPermittedAccounts = getPermittedAccounts;
    this.#getSavedGasFees = getSavedGasFees ?? ((_chainId) => undefined);
    this.#incomingTransactionOptions = incomingTransactions;
    this.#isAutomaticGasFeeUpdateEnabled =
      isAutomaticGasFeeUpdateEnabled ?? ((_txMeta: TransactionMeta) => false);
    this.#isEIP7702GasFeeTokensEnabled =
      isEIP7702GasFeeTokensEnabled ?? (() => Promise.resolve(false));
    this.#isFirstTimeInteractionEnabled =
      isFirstTimeInteractionEnabled ?? (() => true);
    this.#isHistoryDisabled = disableHistory ?? false;
    this.#isSendFlowHistoryDisabled = disableSendFlowHistory ?? false;
    this.#isSimulationEnabled = isSimulationEnabled ?? (() => true);
    this.#isSwapsDisabled = disableSwaps ?? false;
    this.#pendingTransactionOptions = pendingTransactions;
    this.#publicKeyEIP7702 = publicKeyEIP7702;
    this.#publish =
      hooks?.publish ?? (() => Promise.resolve({ transactionHash: undefined }));
    this.#publishBatchHook = hooks?.publishBatch;
    this.#securityProviderRequest = securityProviderRequest;
    this.#sign = sign;
    this.#testGasFeeFlows = testGasFeeFlows === true;
    this.#trace = trace ?? (((_request, fn) => fn?.()) as TraceCallback);
    this.#transactionHistoryLimit = transactionHistoryLimit;

    const findNetworkClientIdByChainId = (chainId: Hex) => {
      return this.messagingSystem.call(
        `NetworkController:findNetworkClientIdByChainId`,
        chainId,
      );
    };

    this.#multichainTrackingHelper = new MultichainTrackingHelper({
      findNetworkClientIdByChainId,
      getNetworkClientById: ((networkClientId: NetworkClientId) => {
        return this.messagingSystem.call(
          `NetworkController:getNetworkClientById`,
          networkClientId,
        );
      }) as NetworkController['getNetworkClientById'],
      getNetworkClientRegistry,
      removePendingTransactionTrackerListeners:
        this.#removePendingTransactionTrackerListeners.bind(this),
      createNonceTracker: this.#createNonceTracker.bind(this),
      createPendingTransactionTracker:
        this.#createPendingTransactionTracker.bind(this),
      onNetworkStateChange: (listener) => {
        this.messagingSystem.subscribe(
          'NetworkController:stateChange',
          listener,
        );
      },
    });

    this.#multichainTrackingHelper.initialize();
    this.#gasFeeFlows = this.#getGasFeeFlows();
    this.#layer1GasFeeFlows = this.#getLayer1GasFeeFlows();

    const gasFeePoller = new GasFeePoller({
      findNetworkClientIdByChainId,
      gasFeeFlows: this.#gasFeeFlows,
      getGasFeeControllerEstimates: this.#getGasFeeEstimates,
      getProvider: (networkClientId) => this.#getProvider({ networkClientId }),
      getTransactions: () => this.state.transactions,
      getTransactionBatches: () => this.state.transactionBatches,
      layer1GasFeeFlows: this.#layer1GasFeeFlows,
      messenger: this.messagingSystem,
      onStateChange: (listener) => {
        this.messagingSystem.subscribe(
          'TransactionController:stateChange',
          listener,
        );
      },
    });

    gasFeePoller.hub.on(
      'transaction-updated',
      this.#onGasFeePollerTransactionUpdate.bind(this),
    );

    gasFeePoller.hub.on(
      'transaction-batch-updated',
      this.#onGasFeePollerTransactionBatchUpdate.bind(this),
    );

    this.#methodDataHelper = new MethodDataHelper({
      getProvider: (networkClientId) => this.#getProvider({ networkClientId }),
      getState: () => this.state.methodData,
    });

    this.#methodDataHelper.hub.on(
      'update',
      ({ fourBytePrefix, methodData }) => {
        this.update((_state) => {
          _state.methodData[fourBytePrefix] = methodData;
        });
      },
    );

    this.#incomingTransactionHelper = new IncomingTransactionHelper({
      client: this.#incomingTransactionOptions.client,
      getCurrentAccount: () => this.#getSelectedAccount(),
      getLocalTransactions: () => this.state.transactions,
      includeTokenTransfers:
        this.#incomingTransactionOptions.includeTokenTransfers,
      isEnabled: this.#incomingTransactionOptions.isEnabled,
      messenger: this.messagingSystem,
      remoteTransactionSource: new AccountsApiRemoteTransactionSource(),
      trimTransactions: this.#trimTransactionsForState.bind(this),
      updateTransactions: this.#incomingTransactionOptions.updateTransactions,
    });

    this.#addIncomingTransactionHelperListeners(
      this.#incomingTransactionHelper,
    );

    // when transactionsController state changes
    // check for pending transactions and start polling if there are any
    this.messagingSystem.subscribe(
      'TransactionController:stateChange',
      this.#checkForPendingTransactionAndStartPolling,
    );

    new ResimulateHelper({
      simulateTransaction: this.#updateSimulationData.bind(this),
      onTransactionsUpdate: (listener) => {
        this.messagingSystem.subscribe(
          'TransactionController:stateChange',
          listener,
          (controllerState) => controllerState.transactions,
        );
      },
      getTransactions: () => this.state.transactions,
    });

    this.#onBootCleanup();
    this.#checkForPendingTransactionAndStartPolling();
    this.#registerActionHandlers();
  }

  /**
   * Stops polling and removes listeners to prepare the controller for garbage collection.
   */
  destroy() {
    this.#stopAllTracking();
  }

  /**
   * Handle new method data request.
   *
   * @param fourBytePrefix - The method prefix.
   * @param networkClientId - The ID of the network client used to fetch the method data.
   * @returns The method data object corresponding to the given signature prefix.
   */
  async handleMethodData(
    fourBytePrefix: string,
    networkClientId: NetworkClientId,
  ): Promise<MethodData> {
    return this.#methodDataHelper.lookup(fourBytePrefix, networkClientId);
  }

  /**
   * Add a batch of transactions to be submitted after approval.
   *
   * @param request - Request object containing the transactions to add.
   * @returns Result object containing the generated batch ID.
   */
  async addTransactionBatch(
    request: TransactionBatchRequest,
  ): Promise<TransactionBatchResult> {
    const { blockTracker } = this.messagingSystem.call(
      `NetworkController:getNetworkClientById`,
      request.networkClientId,
    );

    return await addTransactionBatch({
      addTransaction: this.addTransaction.bind(this),
      getChainId: this.#getChainId.bind(this),
      getEthQuery: (networkClientId) => this.#getEthQuery({ networkClientId }),
      getGasFeeEstimates: this.#getGasFeeEstimates,
      getInternalAccounts: this.#getInternalAccounts.bind(this),
      getPendingTransactionTracker: (networkClientId: NetworkClientId) =>
        this.#createPendingTransactionTracker({
          provider: this.#getProvider({ networkClientId }),
          blockTracker,
          chainId: this.#getChainId(networkClientId),
          networkClientId,
        }),
      getTransaction: (transactionId) =>
        this.#getTransactionOrThrow(transactionId),
      isSimulationEnabled: this.#isSimulationEnabled,
      messenger: this.messagingSystem,
      publishBatchHook: this.#publishBatchHook,
      publicKeyEIP7702: this.#publicKeyEIP7702,
      publishTransaction: (
        ethQuery: EthQuery,
        transactionMeta: TransactionMeta,
      ) => this.#publishTransaction(ethQuery, transactionMeta) as Promise<Hex>,
      request,
      update: this.update.bind(this),
      updateTransaction: this.#updateTransactionInternal.bind(this),
    });
  }

  /**
   * Determine which chains support atomic batch transactions with the given account address.
   *
   * @param request - Request object containing the account address and other parameters.
   * @returns  Result object containing the supported chains and related information.
   */
  async isAtomicBatchSupported(
    request: IsAtomicBatchSupportedRequest,
  ): Promise<IsAtomicBatchSupportedResult> {
    return isAtomicBatchSupported({
      ...request,
      getEthQuery: (chainId) => this.#getEthQuery({ chainId }),
      messenger: this.messagingSystem,
      publicKeyEIP7702: this.#publicKeyEIP7702,
    });
  }

  /**
   * Add a new unapproved transaction to state. Parameters will be validated, a
   * unique transaction id will be generated, and gas and gasPrice will be calculated
   * if not provided. If A `<tx.id>:unapproved` hub event will be emitted once added.
   *
   * @param txParams - Standard parameters for an Ethereum transaction.
   * @param options - Additional options to control how the transaction is added.
   * @param options.actionId - Unique ID to prevent duplicate requests.
   * @param options.batchId - A custom ID for the batch this transaction belongs to.
   * @param options.deviceConfirmedOn - An enum to indicate what device confirmed the transaction.
   * @param options.disableGasBuffer - Whether to disable the gas estimation buffer.
   * @param options.method - RPC method that requested the transaction.
   * @param options.nestedTransactions - Params for any nested transactions encoded in the data.
   * @param options.origin - The origin of the transaction request, such as a dApp hostname.
   * @param options.publishHook - Custom logic to publish the transaction.
   * @param options.requireApproval - Whether the transaction requires approval by the user, defaults to true unless explicitly disabled.
   * @param options.securityAlertResponse - Response from security validator.
   * @param options.sendFlowHistory - The sendFlowHistory entries to add.
   * @param options.type - Type of transaction to add, such as 'cancel' or 'swap'.
   * @param options.swaps - Options for swaps transactions.
   * @param options.swaps.hasApproveTx - Whether the transaction has an approval transaction.
   * @param options.swaps.meta - Metadata for swap transaction.
   * @param options.networkClientId - The id of the network client for this transaction.
   * @param options.traceContext - The parent context for any new traces.
   * @returns Object containing a promise resolving to the transaction hash if approved.
   */
  async addTransaction(
    txParams: TransactionParams,
    options: {
      actionId?: string;
      batchId?: Hex;
      deviceConfirmedOn?: WalletDevice;
      disableGasBuffer?: boolean;
      method?: string;
      nestedTransactions?: NestedTransactionMetadata[];
      networkClientId: NetworkClientId;
      origin?: string;
      publishHook?: PublishHook;
      requireApproval?: boolean | undefined;
      securityAlertResponse?: SecurityAlertResponse;
      sendFlowHistory?: SendFlowHistoryEntry[];
      swaps?: {
        hasApproveTx?: boolean;
        meta?: Partial<TransactionMeta>;
      };
      traceContext?: unknown;
      type?: TransactionType;
    },
  ): Promise<Result> {
    log('Adding transaction', txParams, options);

    const {
      actionId,
      batchId,
      deviceConfirmedOn,
      disableGasBuffer,
      method,
      nestedTransactions,
      networkClientId,
      origin,
      publishHook,
      requireApproval,
      securityAlertResponse,
      sendFlowHistory,
      swaps = {},
      traceContext,
      type,
    } = options;

    txParams = normalizeTransactionParams(txParams);

    if (!this.#multichainTrackingHelper.has(networkClientId)) {
      throw new Error(
        `Network client not found - ${networkClientId as string}`,
      );
    }

    const chainId = this.#getChainId(networkClientId);

    const ethQuery = this.#getEthQuery({
      networkClientId,
    });

    const permittedAddresses =
      origin === undefined
        ? undefined
        : await this.#getPermittedAccounts?.(origin);

    const internalAccounts = this.#getInternalAccounts();

    await validateTransactionOrigin({
      data: txParams.data,
      from: txParams.from,
      internalAccounts,
      origin,
      permittedAddresses,
      txParams,
      type,
    });

    const delegationAddressPromise = getDelegationAddress(
      txParams.from as Hex,
      ethQuery,
    ).catch(() => undefined);

    const isEIP1559Compatible =
      await this.#getEIP1559Compatibility(networkClientId);

    validateTxParams(txParams, isEIP1559Compatible, chainId);

    if (!txParams.type) {
      // Determine transaction type based on transaction parameters and network compatibility
      setEnvelopeType(txParams, isEIP1559Compatible);
    }

    const isDuplicateBatchId =
      batchId?.length &&
      this.state.transactions.some(
        (tx) => tx.batchId?.toLowerCase() === batchId?.toLowerCase(),
      );

    if (isDuplicateBatchId && origin && origin !== ORIGIN_METAMASK) {
      throw new JsonRpcError(
        ErrorCode.DuplicateBundleId,
        'Batch ID already exists',
      );
    }

    const dappSuggestedGasFees = this.#generateDappSuggestedGasFees(
      txParams,
      origin,
    );

    const transactionType =
      type ?? (await determineTransactionType(txParams, ethQuery)).type;

    const delegationAddress = await delegationAddressPromise;

    const existingTransactionMeta = this.#getTransactionWithActionId(actionId);

    // If a request to add a transaction with the same actionId is submitted again, a new transaction will not be created for it.
    let addedTransactionMeta: TransactionMeta = existingTransactionMeta
      ? cloneDeep(existingTransactionMeta)
      : {
          // Add actionId to txMeta to check if same actionId is seen again
          actionId,
          batchId,
          chainId,
          dappSuggestedGasFees,
          delegationAddress,
          deviceConfirmedOn,
          disableGasBuffer,
          id: random(),
          isFirstTimeInteraction: undefined,
          nestedTransactions,
          networkClientId,
          origin,
          securityAlertResponse,
          status: TransactionStatus.unapproved as const,
          time: Date.now(),
          txParams,
          type: transactionType,
          userEditedGasLimit: false,
          verifiedOnBlockchain: false,
        };

    const { updateTransaction } = await this.#afterAdd({
      transactionMeta: addedTransactionMeta,
    });

    if (updateTransaction) {
      log('Updating transaction using afterAdd hook');

      addedTransactionMeta.txParamsOriginal = cloneDeep(
        addedTransactionMeta.txParams,
      );

      updateTransaction(addedTransactionMeta);
    }

    await this.#trace(
      { name: 'Estimate Gas Properties', parentContext: traceContext },
      (context) =>
        this.#updateGasProperties(addedTransactionMeta, {
          traceContext: context,
        }),
    );

    // Checks if a transaction already exists with a given actionId
    if (!existingTransactionMeta) {
      // Set security provider response
      if (method && this.#securityProviderRequest) {
        const securityProviderResponse = await this.#securityProviderRequest(
          addedTransactionMeta,
          method,
        );
        addedTransactionMeta.securityProviderResponse =
          securityProviderResponse;
      }

      if (!this.#isSendFlowHistoryDisabled) {
        addedTransactionMeta.sendFlowHistory = sendFlowHistory ?? [];
      }
      // Initial history push
      if (!this.#isHistoryDisabled) {
        addedTransactionMeta = addInitialHistorySnapshot(addedTransactionMeta);
      }

      addedTransactionMeta = updateSwapsTransaction(
        addedTransactionMeta,
        transactionType,
        swaps,
        {
          isSwapsDisabled: this.#isSwapsDisabled,
          cancelTransaction: this.#rejectTransaction.bind(this),
          messenger: this.messagingSystem,
        },
      );

      this.#addMetadata(addedTransactionMeta);

      if (requireApproval !== false) {
        this.#updateSimulationData(addedTransactionMeta, {
          traceContext,
        }).catch((error) => {
          log('Error while updating simulation data', error);
          throw error;
        });

        this.#updateFirstTimeInteraction(addedTransactionMeta, {
          traceContext,
        }).catch((error) => {
          log('Error while updating first interaction properties', error);
        });
      } else {
        log(
          'Skipping simulation & first interaction update as approval not required',
        );
      }

      this.messagingSystem.publish(
        `${controllerName}:unapprovedTransactionAdded`,
        addedTransactionMeta,
      );
    }

    return {
      result: this.#processApproval(addedTransactionMeta, {
        actionId,
        isExisting: Boolean(existingTransactionMeta),
        publishHook,
        requireApproval,
        traceContext,
      }),
      transactionMeta: addedTransactionMeta,
    };
  }

  startIncomingTransactionPolling() {
    this.#incomingTransactionHelper.start();
  }

  stopIncomingTransactionPolling() {
    this.#incomingTransactionHelper.stop();
  }

  /**
   * Update the incoming transactions by polling the remote transaction source.
   *
   * @param request - Request object.
   * @param request.tags - Additional tags to identify the source of the request.
   */
  async updateIncomingTransactions({ tags }: { tags?: string[] } = {}) {
    await this.#incomingTransactionHelper.update({ tags });
  }

  /**
   * Attempts to cancel a transaction based on its ID by setting its status to "rejected"
   * and emitting a `<tx.id>:finished` hub event.
   *
   * @param transactionId - The ID of the transaction to cancel.
   * @param gasValues - The gas values to use for the cancellation transaction.
   * @param options - The options for the cancellation transaction.
   * @param options.actionId - Unique ID to prevent duplicate requests.
   * @param options.estimatedBaseFee - The estimated base fee of the transaction.
   */
  async stopTransaction(
    transactionId: string,
    gasValues?: GasPriceValue | FeeMarketEIP1559Values,
    {
      estimatedBaseFee,
      actionId,
    }: { estimatedBaseFee?: string; actionId?: string } = {},
  ) {
    await this.#retryTransaction({
      actionId,
      estimatedBaseFee,
      gasValues,
      label: 'cancel',
      rate: CANCEL_RATE,
      transactionId,
      transactionType: TransactionType.cancel,
      prepareTransactionParams: (txParams) => {
        delete txParams.data;
        txParams.to = txParams.from;
        txParams.value = '0x0';
      },
      afterSubmit: (newTransactionMeta) => {
        this.messagingSystem.publish(
          `${controllerName}:transactionFinished`,
          newTransactionMeta,
        );

        this.#internalEvents.emit(
          `${newTransactionMeta.id}:finished`,
          newTransactionMeta,
        );
      },
    });
  }

  /**
   * Attempts to speed up a transaction increasing transaction gasPrice by ten percent.
   *
   * @param transactionId - The ID of the transaction to speed up.
   * @param gasValues - The gas values to use for the speed up transaction.
   * @param options - The options for the speed up transaction.
   * @param options.actionId - Unique ID to prevent duplicate requests
   * @param options.estimatedBaseFee - The estimated base fee of the transaction.
   */
  async speedUpTransaction(
    transactionId: string,
    gasValues?: GasPriceValue | FeeMarketEIP1559Values,
    {
      actionId,
      estimatedBaseFee,
    }: { actionId?: string; estimatedBaseFee?: string } = {},
  ) {
    await this.#retryTransaction({
      actionId,
      estimatedBaseFee,
      gasValues,
      label: 'speed up',
      rate: SPEED_UP_RATE,
      transactionId,
      transactionType: TransactionType.retry,
      afterSubmit: (newTransactionMeta) => {
        this.messagingSystem.publish(
          `${controllerName}:speedupTransactionAdded`,
          newTransactionMeta,
        );
      },
    });
  }

  async #retryTransaction({
    actionId,
    afterSubmit,
    estimatedBaseFee,
    gasValues,
    label,
    prepareTransactionParams,
    rate,
    transactionId,
    transactionType,
  }: {
    actionId?: string;
    afterSubmit?: (transactionMeta: TransactionMeta) => void;
    estimatedBaseFee?: string;
    gasValues?: GasPriceValue | FeeMarketEIP1559Values;
    label: string;
    prepareTransactionParams?: (txParams: TransactionParams) => void;
    rate: number;
    transactionId: string;
    transactionType: TransactionType;
  }) {
    // If transaction is found for same action id, do not create a new transaction.
    if (this.#getTransactionWithActionId(actionId)) {
      return;
    }

    if (gasValues) {
      // Not good practice to reassign a parameter but temporarily avoiding a larger refactor.
      gasValues = normalizeGasFeeValues(gasValues);
      validateGasValues(gasValues);
    }

    log(`Creating ${label} transaction`, transactionId, gasValues);

    const transactionMeta = this.#getTransaction(transactionId);
    /* istanbul ignore next */
    if (!transactionMeta) {
      return;
    }

    /* istanbul ignore next */
    if (!this.#sign) {
      throw new Error('No sign method defined.');
    }

    const newTxParams: TransactionParams =
      getTransactionParamsWithIncreasedGasFee(
        transactionMeta.txParams,
        rate,
        gasValues,
      );

    prepareTransactionParams?.(newTxParams);

    const unsignedEthTx = prepareTransaction(
      transactionMeta.chainId,
      newTxParams,
    );

    const signedTx = await this.#sign(
      unsignedEthTx,
      transactionMeta.txParams.from,
    );

    const transactionMetaWithRsv = this.#updateTransactionMetaRSV(
      transactionMeta,
      signedTx,
    );

    const rawTx = serializeTransaction(signedTx);
    const newFee = newTxParams.maxFeePerGas ?? newTxParams.gasPrice;

    const oldFee = newTxParams.maxFeePerGas
      ? transactionMetaWithRsv.txParams.maxFeePerGas
      : transactionMetaWithRsv.txParams.gasPrice;

    log(`Submitting ${label} transaction`, {
      oldFee,
      newFee,
      txParams: newTxParams,
    });

    const { networkClientId } = transactionMeta;
    const ethQuery = this.#getEthQuery({ networkClientId });

    const newTransactionMeta = {
      ...transactionMetaWithRsv,
      actionId,
      estimatedBaseFee,
      id: random(),
      originalGasEstimate: transactionMeta.txParams.gas,
      originalType: transactionMeta.type,
      rawTx,
      time: Date.now(),
      txParams: newTxParams,
      type: transactionType,
    };

    const hash = await this.#publishTransactionForRetry(ethQuery, {
      ...newTransactionMeta,
      origin: label,
    });

    newTransactionMeta.hash = hash;

    this.#addMetadata(newTransactionMeta);

    // speedUpTransaction has no approval request, so we assume the user has already approved the transaction
    this.messagingSystem.publish(`${controllerName}:transactionApproved`, {
      transactionMeta: newTransactionMeta,
      actionId,
    });

    this.messagingSystem.publish(`${controllerName}:transactionSubmitted`, {
      transactionMeta: newTransactionMeta,
      actionId,
    });

    afterSubmit?.(newTransactionMeta);
  }

  /**
   * Estimates required gas for a given transaction.
   *
   * @param transaction - The transaction to estimate gas for.
   * @param networkClientId - The network client id to use for the estimate.
   * @param options - Additional options for the estimate.
   * @param options.ignoreDelegationSignatures - Ignore signature errors if submitting delegations to the DelegationManager.
   * @returns The gas and gas price.
   */
  async estimateGas(
    transaction: TransactionParams,
    networkClientId: NetworkClientId,
    {
      ignoreDelegationSignatures,
    }: {
      ignoreDelegationSignatures?: boolean;
    } = {},
  ) {
    const ethQuery = this.#getEthQuery({
      networkClientId,
    });

    const { estimatedGas, simulationFails } = await estimateGas({
      chainId: this.#getChainId(networkClientId),
      ethQuery,
      ignoreDelegationSignatures,
      isSimulationEnabled: this.#isSimulationEnabled(),
      messenger: this.messagingSystem,
      txParams: transaction,
    });

    return { gas: estimatedGas, simulationFails };
  }

  /**
   * Estimates required gas for a given transaction and add additional gas buffer with the given multiplier.
   *
   * @param transaction - The transaction params to estimate gas for.
   * @param multiplier - The multiplier to use for the gas buffer.
   * @param networkClientId - The network client id to use for the estimate.
   * @returns The buffered estimated gas and whether the estimation failed.
   */
  async estimateGasBuffered(
    transaction: TransactionParams,
    multiplier: number,
    networkClientId: NetworkClientId,
  ) {
    const ethQuery = this.#getEthQuery({
      networkClientId,
    });

    const { blockGasLimit, estimatedGas, simulationFails } = await estimateGas({
      chainId: this.#getChainId(networkClientId),
      ethQuery,
      isSimulationEnabled: this.#isSimulationEnabled(),
      messenger: this.messagingSystem,
      txParams: transaction,
    });

    const gas = addGasBuffer(estimatedGas, blockGasLimit, multiplier);

    return {
      gas,
      simulationFails,
    };
  }

  /**
   * Updates an existing transaction in state.
   *
   * @param transactionMeta - The new transaction to store in state.
   * @param note - A note or update reason to include in the transaction history.
   */
  updateTransaction(transactionMeta: TransactionMeta, note: string) {
    const { id: transactionId } = transactionMeta;

    this.#updateTransactionInternal({ transactionId, note }, () => ({
      ...transactionMeta,
    }));
  }

  /**
   * Update the security alert response for a transaction.
   *
   * @param transactionId - ID of the transaction.
   * @param securityAlertResponse - The new security alert response for the transaction.
   */
  updateSecurityAlertResponse(
    transactionId: string,
    securityAlertResponse: SecurityAlertResponse,
  ) {
    if (!securityAlertResponse) {
      throw new Error(
        'updateSecurityAlertResponse: securityAlertResponse should not be null',
      );
    }
    const transactionMeta = this.#getTransaction(transactionId);
    if (!transactionMeta) {
      throw new Error(
        `Cannot update security alert response as no transaction metadata found`,
      );
    }
    const updatedTransactionMeta = {
      ...transactionMeta,
      securityAlertResponse,
    };
    this.updateTransaction(
      updatedTransactionMeta,
      `${controllerName}:updatesecurityAlertResponse - securityAlertResponse updated`,
    );
  }

  /**
   * Remove transactions from state.
   *
   * @param options - The options bag.
   * @param options.address - Remove transactions from this account only. Defaults to all accounts.
   * @param options.chainId - Remove transactions for the specified chain only. Defaults to all chains.
   */
  wipeTransactions({
    address,
    chainId,
  }: {
    address?: string;
    chainId?: string;
  } = {}) {
    if (!chainId && !address) {
      this.update((state) => {
        state.transactions = [];
      });

      return;
    }

    const newTransactions = this.state.transactions.filter(
      ({ chainId: txChainId, txParams, type }) => {
        const isMatchingNetwork = !chainId || chainId === txChainId;

        if (!isMatchingNetwork) {
          return true;
        }

        const isMatchingAddress =
          !address ||
          txParams.from?.toLowerCase() === address.toLowerCase() ||
          (type === TransactionType.incoming &&
            txParams.to?.toLowerCase() === address.toLowerCase());

        return !isMatchingAddress;
      },
    );

    this.update((state) => {
      state.transactions = this.#trimTransactionsForState(newTransactions);
    });
  }

  /**
   * Adds external provided transaction to state as confirmed transaction.
   *
   * @param transactionMeta - TransactionMeta to add transactions.
   * @param transactionReceipt - TransactionReceipt of the external transaction.
   * @param baseFeePerGas - Base fee per gas of the external transaction.
   */
  async confirmExternalTransaction(
    transactionMeta: TransactionMeta,
    transactionReceipt: TransactionReceipt,
    baseFeePerGas: Hex,
  ) {
    // Run validation and add external transaction to state.
    const newTransactionMeta = this.#addExternalTransaction(transactionMeta);

    try {
      const transactionId = newTransactionMeta.id;

      // Make sure status is confirmed and define gasUsed as in receipt.
      const updatedTransactionMeta = {
        ...newTransactionMeta,
        status: TransactionStatus.confirmed as const,
        txReceipt: transactionReceipt,
      };
      if (baseFeePerGas) {
        updatedTransactionMeta.baseFeePerGas = baseFeePerGas;
      }

      // Update same nonce local transactions as dropped and define replacedBy properties.
      this.#markNonceDuplicatesDropped(transactionId);

      // Update external provided transaction with updated gas values and confirmed status.
      this.updateTransaction(
        updatedTransactionMeta,
        `${controllerName}:confirmExternalTransaction - Add external transaction`,
      );
      this.#onTransactionStatusChange(updatedTransactionMeta);

      // Intentional given potential duration of process.
      this.#updatePostBalance(updatedTransactionMeta).catch((error) => {
        /* istanbul ignore next */
        log('Error while updating post balance', error);
        throw error;
      });

      this.messagingSystem.publish(
        `${controllerName}:transactionConfirmed`,
        updatedTransactionMeta,
      );
    } catch (error) {
      console.error('Failed to confirm external transaction', error);
    }
  }

  /**
   * Append new send flow history to a transaction.
   *
   * @param transactionID - The ID of the transaction to update.
   * @param currentSendFlowHistoryLength - The length of the current sendFlowHistory array.
   * @param sendFlowHistoryToAdd - The sendFlowHistory entries to add.
   * @returns The updated transactionMeta.
   */
  updateTransactionSendFlowHistory(
    transactionID: string,
    currentSendFlowHistoryLength: number,
    sendFlowHistoryToAdd: SendFlowHistoryEntry[],
  ): TransactionMeta {
    if (this.#isSendFlowHistoryDisabled) {
      throw new Error(
        'Send flow history is disabled for the current transaction controller',
      );
    }

    const transactionMeta = this.#getTransaction(transactionID);

    if (!transactionMeta) {
      throw new Error(
        `Cannot update send flow history as no transaction metadata found`,
      );
    }

    validateIfTransactionUnapproved(
      transactionMeta,
      'updateTransactionSendFlowHistory',
    );

    const sendFlowHistory = transactionMeta.sendFlowHistory ?? [];
    if (currentSendFlowHistoryLength === sendFlowHistory.length) {
      const updatedTransactionMeta = {
        ...transactionMeta,
        sendFlowHistory: [...sendFlowHistory, ...sendFlowHistoryToAdd],
      };
      this.updateTransaction(
        updatedTransactionMeta,
        `${controllerName}:updateTransactionSendFlowHistory - sendFlowHistory updated`,
      );
    }

    return this.#getTransaction(transactionID) as TransactionMeta;
  }

  /**
   * Update the gas values of a transaction.
   *
   * @param transactionId - The ID of the transaction to update.
   * @param gasValues - Gas values to update.
   * @param gasValues.gas - Same as transaction.gasLimit.
   * @param gasValues.gasLimit - Maxmimum number of units of gas to use for this transaction.
   * @param gasValues.gasPrice - Price per gas for legacy transactions.
   * @param gasValues.maxPriorityFeePerGas - Maximum amount per gas to give to validator as incentive.
   * @param gasValues.maxFeePerGas - Maximum amount per gas to pay for the transaction, including the priority fee.
   * @param gasValues.estimateUsed - Which estimate level was used.
   * @param gasValues.estimateSuggested - Which estimate level that the API suggested.
   * @param gasValues.defaultGasEstimates - The default estimate for gas.
   * @param gasValues.originalGasEstimate - Original estimate for gas.
   * @param gasValues.userEditedGasLimit - The gas limit supplied by user.
   * @param gasValues.userFeeLevel - Estimate level user selected.
   * @returns The updated transactionMeta.
   */
  updateTransactionGasFees(
    transactionId: string,
    {
      defaultGasEstimates,
      estimateUsed,
      estimateSuggested,
      gas,
      gasLimit,
      gasPrice,
      maxPriorityFeePerGas,
      maxFeePerGas,
      originalGasEstimate,
      userEditedGasLimit,
      userFeeLevel: userFeeLevelParam,
    }: {
      defaultGasEstimates?: string;
      estimateUsed?: string;
      estimateSuggested?: string;
      gas?: string;
      gasLimit?: string;
      gasPrice?: string;
      maxPriorityFeePerGas?: string;
      maxFeePerGas?: string;
      originalGasEstimate?: string;
      userEditedGasLimit?: boolean;
      userFeeLevel?: string;
    },
  ): TransactionMeta {
    const transactionMeta = this.#getTransaction(transactionId);

    if (!transactionMeta) {
      throw new Error(
        `Cannot update transaction as no transaction metadata found`,
      );
    }

    validateIfTransactionUnapproved(
      transactionMeta,
      'updateTransactionGasFees',
    );

    const clonedTransactionMeta = cloneDeep(transactionMeta);
    const isTransactionGasFeeEstimatesExists = transactionMeta.gasFeeEstimates;
    const isAutomaticGasFeeUpdateEnabled =
      this.#isAutomaticGasFeeUpdateEnabled(transactionMeta);
    const userFeeLevel = userFeeLevelParam as GasFeeEstimateLevelType;
    const isOneOfFeeLevelSelected =
      Object.values(GasFeeEstimateLevel).includes(userFeeLevel);
    const shouldUpdateTxParamsGasFees =
      isTransactionGasFeeEstimatesExists &&
      isAutomaticGasFeeUpdateEnabled &&
      isOneOfFeeLevelSelected;

    if (shouldUpdateTxParamsGasFees) {
      updateTransactionGasEstimates({
        txMeta: clonedTransactionMeta,
        userFeeLevel,
      });
    }

    const txParamsUpdate = {
      gas,
      gasLimit,
    };

    if (shouldUpdateTxParamsGasFees) {
      // Get updated values from clonedTransactionMeta if we're using automated fee updates
      Object.assign(txParamsUpdate, {
        gasPrice: clonedTransactionMeta.txParams.gasPrice,
        maxPriorityFeePerGas:
          clonedTransactionMeta.txParams.maxPriorityFeePerGas,
        maxFeePerGas: clonedTransactionMeta.txParams.maxFeePerGas,
      });
    } else {
      Object.assign(txParamsUpdate, {
        gasPrice,
        maxPriorityFeePerGas,
        maxFeePerGas,
      });
    }

    const transactionGasFees = {
      txParams: pickBy(txParamsUpdate),
      defaultGasEstimates,
      estimateUsed,
      estimateSuggested,
      originalGasEstimate,
      userEditedGasLimit,
      userFeeLevel,
    };

    const filteredTransactionGasFees = pickBy(transactionGasFees);

    this.#updateTransactionInternal(
      {
        transactionId,
        note: `${controllerName}:updateTransactionGasFees - gas values updated`,
        skipResimulateCheck: true,
      },
      (draftTxMeta) => {
        const { txParams, ...otherProps } = filteredTransactionGasFees;
        Object.assign(draftTxMeta, otherProps);
        if (txParams) {
          Object.assign(draftTxMeta.txParams, txParams);
        }
      },
    );

    return this.#getTransaction(transactionId) as TransactionMeta;
  }

  /**
   * Update the previous gas values of a transaction.
   *
   * @param transactionId - The ID of the transaction to update.
   * @param previousGas - Previous gas values to update.
   * @param previousGas.gasLimit - Maxmimum number of units of gas to use for this transaction.
   * @param previousGas.maxFeePerGas - Maximum amount per gas to pay for the transaction, including the priority fee.
   * @param previousGas.maxPriorityFeePerGas - Maximum amount per gas to give to validator as incentive.
   * @returns The updated transactionMeta.
   */
  updatePreviousGasParams(
    transactionId: string,
    {
      gasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas,
    }: {
      gasLimit?: string;
      maxFeePerGas?: string;
      maxPriorityFeePerGas?: string;
    },
  ): TransactionMeta {
    const transactionMeta = this.#getTransaction(transactionId);

    if (!transactionMeta) {
      throw new Error(
        `Cannot update transaction as no transaction metadata found`,
      );
    }

    validateIfTransactionUnapproved(transactionMeta, 'updatePreviousGasParams');

    const transactionPreviousGas = {
      previousGas: {
        gasLimit,
        maxFeePerGas,
        maxPriorityFeePerGas,
      },
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    // only update what is defined
    transactionPreviousGas.previousGas = pickBy(
      transactionPreviousGas.previousGas,
    );

    // merge updated previous gas values with existing transaction meta
    const updatedMeta = merge({}, transactionMeta, transactionPreviousGas);

    this.updateTransaction(
      updatedMeta,
      `${controllerName}:updatePreviousGasParams - Previous gas values updated`,
    );

    return this.#getTransaction(transactionId) as TransactionMeta;
  }

  async getNonceLock(
    address: string,
    networkClientId: NetworkClientId,
  ): Promise<NonceLock> {
    return this.#multichainTrackingHelper.getNonceLock(
      address,
      networkClientId,
    );
  }

  /**
   * Updates the editable parameters of a transaction.
   *
   * @param txId - The ID of the transaction to update.
   * @param params - The editable parameters to update.
   * @param params.containerTypes - Container types applied to the parameters.
   * @param params.data - Data to pass with the transaction.
   * @param params.from - Address to send the transaction from.
   * @param params.gas - Maximum number of units of gas to use for the transaction.
   * @param params.gasPrice - Price per gas for legacy transactions.
   * @param params.maxFeePerGas - Maximum amount per gas to pay for the transaction, including the priority fee.
   * @param params.maxPriorityFeePerGas - Maximum amount per gas to give to validator as incentive.
   * @param params.to - Address to send the transaction to.
   * @param params.value - Value associated with the transaction.
   * @returns The updated transaction metadata.
   */
  async updateEditableParams(
    txId: string,
    {
      containerTypes,
      data,
      from,
      gas,
      gasPrice,
      maxFeePerGas,
      maxPriorityFeePerGas,
      to,
      value,
    }: {
      containerTypes?: TransactionContainerType[];
      data?: string;
      from?: string;
      gas?: string;
      gasPrice?: string;
      maxFeePerGas?: string;
      maxPriorityFeePerGas?: string;
      to?: string;
      value?: string;
    },
  ) {
    const transactionMeta = this.#getTransaction(txId);

    if (!transactionMeta) {
      throw new Error(
        `Cannot update editable params as no transaction metadata found`,
      );
    }

    validateIfTransactionUnapproved(transactionMeta, 'updateEditableParams');

    const editableParams = {
      txParams: {
        data,
        from,
        to,
        value,
        gas,
        gasPrice,
        maxFeePerGas,
        maxPriorityFeePerGas,
      },
    } as Partial<TransactionMeta>;

    editableParams.txParams = pickBy(
      editableParams.txParams,
    ) as TransactionParams;

    const updatedTransaction = merge({}, transactionMeta, editableParams);

    const { networkClientId } = transactionMeta;
    const provider = this.#getProvider({ networkClientId });
    const ethQuery = new EthQuery(provider);

    const { type } = await determineTransactionType(
      updatedTransaction.txParams,
      ethQuery,
    );

    updatedTransaction.type = type;

    if (containerTypes) {
      updatedTransaction.containerTypes = containerTypes;
    }

    await updateTransactionLayer1GasFee({
      layer1GasFeeFlows: this.#layer1GasFeeFlows,
      messenger: this.messagingSystem,
      provider,
      transactionMeta: updatedTransaction,
    });

    this.updateTransaction(
      updatedTransaction,
      `Update Editable Params for ${txId}`,
    );

    return this.#getTransaction(txId);
  }

  /**
   * Update the isActive state of a transaction.
   *
   * @param transactionId - The ID of the transaction to update.
   * @param isActive - The active state.
   */
  setTransactionActive(transactionId: string, isActive: boolean) {
    const transactionMeta = this.#getTransaction(transactionId);

    if (!transactionMeta) {
      throw new Error(`Transaction with id ${transactionId} not found`);
    }

    this.#updateTransactionInternal(
      {
        transactionId,
        note: 'TransactionController#setTransactionActive - Transaction isActive updated',
        skipHistory: true,
        skipValidation: true,
        skipResimulateCheck: true,
      },
      (updatedTransactionMeta) => {
        updatedTransactionMeta.isActive = isActive;
      },
    );
  }

  /**
   * Signs and returns the raw transaction data for provided transaction params list.
   *
   * @param listOfTxParams - The list of transaction params to approve.
   * @param opts - Options bag.
   * @param opts.hasNonce - Whether the transactions already have a nonce.
   * @returns The raw transactions.
   */
  async approveTransactionsWithSameNonce(
    listOfTxParams: (TransactionParams & { chainId: Hex })[] = [],
    { hasNonce }: { hasNonce?: boolean } = {},
  ): Promise<string | string[]> {
    log('Approving transactions with same nonce', {
      transactions: listOfTxParams,
    });

    if (listOfTxParams.length === 0) {
      return '';
    }

    const initialTx = listOfTxParams[0];
    const { chainId } = initialTx;
    const networkClientId = this.#getNetworkClientId({ chainId });
    const initialTxAsEthTx = prepareTransaction(chainId, initialTx);
    const initialTxAsSerializedHex = serializeTransaction(initialTxAsEthTx);

    if (this.#approvingTransactionIds.has(initialTxAsSerializedHex)) {
      return '';
    }

    this.#approvingTransactionIds.add(initialTxAsSerializedHex);

    let rawTransactions, nonceLock;
    try {
      // TODO: we should add a check to verify that all transactions have the same from address
      const fromAddress = initialTx.from;
      const requiresNonce = hasNonce !== true;

      nonceLock = requiresNonce
        ? await this.getNonceLock(fromAddress, networkClientId)
        : undefined;

      const nonce = nonceLock
        ? add0x(nonceLock.nextNonce.toString(16))
        : initialTx.nonce;

      if (nonceLock) {
        log('Using nonce from nonce tracker', nonce, nonceLock.nonceDetails);
      }

      rawTransactions = await Promise.all(
        listOfTxParams.map((txParams) => {
          txParams.nonce = nonce;
          return this.#signExternalTransaction(txParams.chainId, txParams);
        }),
      );
    } catch (err) {
      log('Error while signing transactions with same nonce', err);
      // Must set transaction to submitted/failed before releasing lock
      // continue with error chain
      throw err;
    } finally {
      nonceLock?.releaseLock();
      this.#approvingTransactionIds.delete(initialTxAsSerializedHex);
    }
    return rawTransactions;
  }

  /**
   * Update a custodial transaction.
   *
   * @param request - The custodial transaction update request.
   *
   * @returns The updated transaction metadata.
   */
  updateCustodialTransaction(request: UpdateCustodialTransactionRequest) {
    const {
      transactionId,
      errorMessage,
      hash,
      status,
      gasLimit,
      gasPrice,
      maxFeePerGas,
      maxPriorityFeePerGas,
      nonce,
      type,
    } = request;

    const transactionMeta = this.#getTransaction(transactionId);

    if (!transactionMeta) {
      throw new Error(
        `Cannot update custodial transaction as no transaction metadata found`,
      );
    }

    if (
      status &&
      ![
        TransactionStatus.submitted,
        TransactionStatus.signed,
        TransactionStatus.failed,
      ].includes(status)
    ) {
      throw new Error(
        `Cannot update custodial transaction with status: ${status}`,
      );
    }
    const updatedTransactionMeta = merge(
      {},
      transactionMeta,
      pickBy({ hash, status }),
    ) as TransactionMeta;

    if (updatedTransactionMeta.status === TransactionStatus.submitted) {
      updatedTransactionMeta.submittedTime = new Date().getTime();
    }

    if (updatedTransactionMeta.status === TransactionStatus.failed) {
      updatedTransactionMeta.error = normalizeTxError(new Error(errorMessage));
    }

    // Update txParams properties with a single pickBy operation
    updatedTransactionMeta.txParams = merge(
      {},
      updatedTransactionMeta.txParams,
      pickBy({
        gasLimit,
        gasPrice,
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce,
        type,
      }),
    );

    // Special case for type change to legacy
    if (type === TransactionEnvelopeType.legacy) {
      delete updatedTransactionMeta.txParams.maxFeePerGas;
      delete updatedTransactionMeta.txParams.maxPriorityFeePerGas;
    }

    this.updateTransaction(
      updatedTransactionMeta,
      `${controllerName}:updateCustodialTransaction - Custodial transaction updated`,
    );

    if (
      status &&
      [TransactionStatus.submitted, TransactionStatus.failed].includes(
        status as TransactionStatus,
      )
    ) {
      this.messagingSystem.publish(
        `${controllerName}:transactionFinished`,
        updatedTransactionMeta,
      );
      this.#internalEvents.emit(
        `${updatedTransactionMeta.id}:finished`,
        updatedTransactionMeta,
      );
    }

    return updatedTransactionMeta;
  }

  /**
   * Search transaction metadata for matching entries.
   *
   * @param opts - Options bag.
   * @param opts.initialList - The transactions to search. Defaults to the current state.
   * @param opts.limit - The maximum number of transactions to return. No limit by default.
   * @param opts.searchCriteria - An object containing values or functions for transaction properties to filter transactions with.
   * @returns An array of transactions matching the provided options.
   */
  getTransactions({
    initialList,
    limit,
    searchCriteria = {},
  }: {
    initialList?: TransactionMeta[];
    limit?: number;
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    searchCriteria?: any;
  } = {}): TransactionMeta[] {
    // searchCriteria is an object that might have values that aren't predicate
    // methods. When providing any other value type (string, number, etc), we
    // consider this shorthand for "check the value at key for strict equality
    // with the provided value". To conform this object to be only methods, we
    // mapValues (lodash) such that every value on the object is a method that
    // returns a boolean.
    const predicateMethods = mapValues(searchCriteria, (predicate) => {
      return typeof predicate === 'function'
        ? predicate
        : // TODO: Replace `any` with type
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (v: any) => v === predicate;
    });

    const transactionsToFilter = initialList ?? this.state.transactions;

    // Combine sortBy and pickBy to transform our state object into an array of
    // matching transactions that are sorted by time.
    const filteredTransactions = sortBy(
      pickBy(transactionsToFilter, (transaction) => {
        // iterate over the predicateMethods keys to check if the transaction
        // matches the searchCriteria
        for (const [key, predicate] of Object.entries(predicateMethods)) {
          // We return false early as soon as we know that one of the specified
          // search criteria do not match the transaction. This prevents
          // needlessly checking all criteria when we already know the criteria
          // are not fully satisfied. We check both txParams and the base
          // object as predicate keys can be either.
          if (key in transaction.txParams) {
            // TODO: Replace `any` with type
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (predicate((transaction.txParams as any)[key]) === false) {
              return false;
            }
            // TODO: Replace `any` with type
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } else if (predicate((transaction as any)[key]) === false) {
            return false;
          }
        }

        return true;
      }),
      'time',
    );
    if (limit !== undefined) {
      // We need to have all transactions of a given nonce in order to display
      // necessary details in the UI. We use the size of this set to determine
      // whether we have reached the limit provided, thus ensuring that all
      // transactions of nonces we include will be sent to the UI.
      const nonces = new Set();
      const txs = [];
      // By default, the transaction list we filter from is sorted by time ASC.
      // To ensure that filtered results prefers the newest transactions we
      // iterate from right to left, inserting transactions into front of a new
      // array. The original order is preserved, but we ensure that newest txs
      // are preferred.
      for (let i = filteredTransactions.length - 1; i > -1; i--) {
        const txMeta = filteredTransactions[i];
        const { nonce } = txMeta.txParams;
        if (!nonces.has(nonce)) {
          if (nonces.size < limit) {
            nonces.add(nonce);
          } else {
            continue;
          }
        }
        // Push transaction into the beginning of our array to ensure the
        // original order is preserved.
        txs.unshift(txMeta);
      }
      return txs;
    }
    return filteredTransactions;
  }

  async estimateGasFee({
    transactionParams,
    chainId,
    networkClientId: requestNetworkClientId,
  }: {
    transactionParams: TransactionParams;
    chainId?: Hex;
    networkClientId?: NetworkClientId;
  }): Promise<GasFeeFlowResponse> {
    const { id: networkClientId, provider } =
      this.#multichainTrackingHelper.getNetworkClient({
        chainId,
        networkClientId: requestNetworkClientId,
      });

    const transactionMeta = {
      txParams: transactionParams,
      chainId,
      networkClientId,
    } as TransactionMeta;

    // Guaranteed as the default gas fee flow matches all transactions.
    const gasFeeFlow = getGasFeeFlow(
      transactionMeta,
      this.#gasFeeFlows,
      this.messagingSystem,
    ) as GasFeeFlow;

    const ethQuery = new EthQuery(provider);

    const gasFeeControllerData = await this.#getGasFeeEstimates({
      networkClientId,
    });

    return gasFeeFlow.getGasFees({
      ethQuery,
      gasFeeControllerData,
      messenger: this.messagingSystem,
      transactionMeta,
    });
  }

  /**
   * Determine the layer 1 gas fee for the given transaction parameters.
   *
   * @param request - The request object.
   * @param request.transactionParams - The transaction parameters to estimate the layer 1 gas fee for.
   * @param request.chainId - The ID of the chain where the transaction will be executed.
   * @param request.networkClientId - The ID of a specific network client to process the transaction.
   * @returns The layer 1 gas fee.
   */
  async getLayer1GasFee({
    transactionParams,
    chainId,
    networkClientId,
  }: {
    transactionParams: TransactionParams;
    chainId?: Hex;
    networkClientId?: NetworkClientId;
  }): Promise<Hex | undefined> {
    const provider = this.#getProvider({
      chainId,
      networkClientId,
    });

    return await getTransactionLayer1GasFee({
      layer1GasFeeFlows: this.#layer1GasFeeFlows,
      messenger: this.messagingSystem,
      provider,
      transactionMeta: {
        txParams: transactionParams,
        chainId,
      } as TransactionMeta,
    });
  }

  async #signExternalTransaction(
    chainId: Hex,
    transactionParams: TransactionParams,
  ): Promise<string> {
    if (!this.#sign) {
      throw new Error('No sign method defined.');
    }

    const normalizedTransactionParams =
      normalizeTransactionParams(transactionParams);
    const type = isEIP1559Transaction(normalizedTransactionParams)
      ? TransactionEnvelopeType.feeMarket
      : TransactionEnvelopeType.legacy;
    const updatedTransactionParams = {
      ...normalizedTransactionParams,
      type,
      gasLimit: normalizedTransactionParams.gas,
      chainId,
    };

    const { from } = updatedTransactionParams;

    const unsignedTransaction = prepareTransaction(
      chainId,
      updatedTransactionParams,
    );

    const signedTransaction = await this.#sign(unsignedTransaction, from);
    const rawTransaction = serializeTransaction(signedTransaction);

    return rawTransaction;
  }

  /**
   * Removes unapproved transactions from state.
   */
  clearUnapprovedTransactions() {
    const transactions = this.state.transactions.filter(
      ({ status }) => status !== TransactionStatus.unapproved,
    );
    this.update((state) => {
      state.transactions = this.#trimTransactionsForState(transactions);
    });
  }

  /**
   * Stop the signing process for a specific transaction.
   * Throws an error causing the transaction status to be set to failed.
   *
   * @param transactionId - The ID of the transaction to stop signing.
   */
  abortTransactionSigning(transactionId: string) {
    const transactionMeta = this.#getTransaction(transactionId);

    if (!transactionMeta) {
      throw new Error(`Cannot abort signing as no transaction metadata found`);
    }

    const abortCallback = this.#signAbortCallbacks.get(transactionId);

    if (!abortCallback) {
      throw new Error(
        `Cannot abort signing as transaction is not waiting for signing`,
      );
    }

    abortCallback();

    this.#signAbortCallbacks.delete(transactionId);
  }

  /**
   * Update the transaction data of a single nested transaction within an atomic batch transaction.
   *
   * @param options - The options bag.
   * @param options.transactionId - ID of the atomic batch transaction.
   * @param options.transactionIndex - Index of the nested transaction within the atomic batch transaction.
   * @param options.transactionData - New data to set for the nested transaction.
   * @returns The updated data for the atomic batch transaction.
   */
  async updateAtomicBatchData({
    transactionId,
    transactionIndex,
    transactionData,
  }: {
    transactionId: string;
    transactionIndex: number;
    transactionData: Hex;
  }) {
    log('Updating atomic batch data', {
      transactionId,
      transactionIndex,
      transactionData,
    });

    const updatedTransactionMeta = this.#updateTransactionInternal(
      {
        transactionId,
        note: 'TransactionController#updateAtomicBatchData - Atomic batch data updated',
      },
      (transactionMeta) => {
        const { nestedTransactions, txParams } = transactionMeta;
        const from = txParams.from as Hex;
        const nestedTransaction = nestedTransactions?.[transactionIndex];

        if (!nestedTransaction) {
          throw new Error(
            `Nested transaction not found with index - ${transactionIndex}`,
          );
        }

        nestedTransaction.data = transactionData;

        const batchTransaction = generateEIP7702BatchTransaction(
          from,
          nestedTransactions,
        );

        transactionMeta.txParams.data = batchTransaction.data;
      },
    );

    const draftTransaction = cloneDeep({
      ...updatedTransactionMeta,
      txParams: {
        ...updatedTransactionMeta.txParams,
        // Clear existing gas to force estimation
        gas: undefined,
      },
    });

    await this.#updateGasEstimate(draftTransaction);

    this.#updateTransactionInternal(
      {
        transactionId,
        note: 'TransactionController#updateAtomicBatchData - Gas estimate updated',
      },
      (transactionMeta) => {
        transactionMeta.txParams.gas = draftTransaction.txParams.gas;
        transactionMeta.simulationFails = draftTransaction.simulationFails;
        transactionMeta.gasLimitNoBuffer = draftTransaction.gasLimitNoBuffer;
      },
    );

    return updatedTransactionMeta.txParams.data as Hex;
  }

  /**
   * Update the batch transactions associated with a transaction.
   * These transactions will be submitted with the main transaction as a batch.
   *
   * @param request - The request object.
   * @param request.transactionId - The ID of the transaction to update.
   * @param request.batchTransactions - The new batch transactions.
   */
  updateBatchTransactions({
    transactionId,
    batchTransactions,
  }: {
    transactionId: string;
    batchTransactions: BatchTransactionParams[];
  }) {
    log('Updating batch transactions', { transactionId, batchTransactions });

    this.#updateTransactionInternal(
      {
        transactionId,
        note: 'TransactionController#updateBatchTransactions - Batch transactions updated',
      },
      (transactionMeta) => {
        transactionMeta.batchTransactions = batchTransactions;
      },
    );
  }

  /**
   * Update the selected gas fee token for a transaction.
   *
   * @param transactionId - The ID of the transaction to update.
   * @param contractAddress - The contract address of the selected gas fee token.
   */
  updateSelectedGasFeeToken(
    transactionId: string,
    contractAddress: Hex | undefined,
  ) {
    this.#updateTransactionInternal({ transactionId }, (transactionMeta) => {
      const hasMatchingGasFeeToken = transactionMeta.gasFeeTokens?.some(
        (token) =>
          token.tokenAddress.toLowerCase() === contractAddress?.toLowerCase(),
      );

      if (contractAddress && !hasMatchingGasFeeToken) {
        throw new Error(
          `No matching gas fee token found with address - ${contractAddress}`,
        );
      }

      transactionMeta.selectedGasFeeToken = contractAddress;
    });
  }

  #addMetadata(transactionMeta: TransactionMeta) {
    validateTxParams(transactionMeta.txParams);
    this.update((state) => {
      state.transactions = this.#trimTransactionsForState([
        ...state.transactions,
        transactionMeta,
      ]);
    });
  }

  async #updateGasProperties(
    transactionMeta: TransactionMeta,
    { traceContext }: { traceContext?: TraceContext } = {},
  ) {
    const isEIP1559Compatible =
      transactionMeta.txParams.type !== TransactionEnvelopeType.legacy &&
      (await this.#getEIP1559Compatibility(transactionMeta.networkClientId));

    const { networkClientId } = transactionMeta;
    const ethQuery = this.#getEthQuery({ networkClientId });
    const provider = this.#getProvider({ networkClientId });

    await this.#trace(
      { name: 'Update Gas', parentContext: traceContext },
      async () => {
        await this.#updateGasEstimate(transactionMeta);
      },
    );

    await this.#trace(
      { name: 'Update Gas Fees', parentContext: traceContext },
      async () =>
        await updateGasFees({
          eip1559: isEIP1559Compatible,
          ethQuery,
          gasFeeFlows: this.#gasFeeFlows,
          getGasFeeEstimates: this.#getGasFeeEstimates,
          getSavedGasFees: this.#getSavedGasFees.bind(this),
          messenger: this.messagingSystem,
          txMeta: transactionMeta,
        }),
    );

    await this.#trace(
      { name: 'Update Layer 1 Gas Fees', parentContext: traceContext },
      async () =>
        await updateTransactionLayer1GasFee({
          layer1GasFeeFlows: this.#layer1GasFeeFlows,
          messenger: this.messagingSystem,
          provider,
          transactionMeta,
        }),
    );
  }

  #onBootCleanup() {
    this.clearUnapprovedTransactions();
    this.#failIncompleteTransactions();
  }

  #failIncompleteTransactions() {
    const incompleteTransactions = this.state.transactions.filter(
      (transaction) =>
        [TransactionStatus.approved, TransactionStatus.signed].includes(
          transaction.status,
        ),
    );

    for (const transactionMeta of incompleteTransactions) {
      this.#failTransaction(
        transactionMeta,
        new Error('Transaction incomplete at startup'),
      );
    }
  }

  async #processApproval(
    transactionMeta: TransactionMeta,
    {
      actionId,
      isExisting = false,
      publishHook,
      requireApproval,
      shouldShowRequest = true,
      traceContext,
    }: {
      actionId?: string;
      isExisting?: boolean;
      publishHook?: PublishHook;
      requireApproval?: boolean | undefined;
      shouldShowRequest?: boolean;
      traceContext?: TraceContext;
    },
  ): Promise<string> {
    const transactionId = transactionMeta.id;
    let resultCallbacks: AcceptResultCallbacks | undefined;
    const { meta, isCompleted } = this.#isTransactionCompleted(transactionId);

    const finishedPromise = isCompleted
      ? Promise.resolve(meta)
      : this.#waitForTransactionFinished(transactionId);

    if (meta && !isExisting && !isCompleted) {
      try {
        if (requireApproval !== false) {
          const acceptResult = await this.#trace(
            { name: 'Await Approval', parentContext: traceContext },
            (context) =>
              this.#requestApproval(transactionMeta, {
                shouldShowRequest,
                traceContext: context,
              }),
          );

          resultCallbacks = acceptResult.resultCallbacks;

          const approvalValue = acceptResult.value as
            | {
                txMeta?: TransactionMeta;
              }
            | undefined;

          const updatedTransaction = approvalValue?.txMeta;

          if (updatedTransaction) {
            log('Updating transaction with approval data', {
              customNonce: updatedTransaction.customNonceValue,
              params: updatedTransaction.txParams,
            });

            this.updateTransaction(
              updatedTransaction,
              'TransactionController#processApproval - Updated with approval data',
            );
          }
        }

        const { isCompleted: isTxCompleted } =
          this.#isTransactionCompleted(transactionId);

        if (!isTxCompleted) {
          const approvalResult = await this.#approveTransaction(
            transactionId,
            traceContext,
            publishHook,
          );
          if (
            approvalResult === ApprovalState.SkippedViaBeforePublishHook &&
            resultCallbacks
          ) {
            resultCallbacks.success();
          }
          const updatedTransactionMeta = this.#getTransaction(
            transactionId,
          ) as TransactionMeta;
          this.messagingSystem.publish(
            `${controllerName}:transactionApproved`,
            {
              transactionMeta: updatedTransactionMeta,
              actionId,
            },
          );
        }
      } catch (rawError: unknown) {
        const error = rawError as Error & { code?: number; data?: Json };

        const { isCompleted: isTxCompleted } =
          this.#isTransactionCompleted(transactionId);

        if (!isTxCompleted) {
          if (this.#isRejectError(error)) {
            this.#rejectTransactionAndThrow(transactionId, actionId, error);
          } else {
            this.#failTransaction(meta, error, actionId);
          }
        }
      } finally {
        this.#skipSimulationTransactionIds.delete(transactionId);
      }
    }

    const finalMeta = await finishedPromise;

    switch (finalMeta?.status) {
      case TransactionStatus.failed:
        const error = finalMeta.error as Error;
        resultCallbacks?.error(error);
        throw rpcErrors.internal(error.message);

      case TransactionStatus.submitted:
        resultCallbacks?.success();
        return finalMeta.hash as string;

      default:
        const internalError = rpcErrors.internal(
          `MetaMask Tx Signature: Unknown problem: ${JSON.stringify(
            finalMeta || transactionId,
          )}`,
        );

        resultCallbacks?.error(internalError);
        throw internalError;
    }
  }

  /**
   * Approves a transaction and updates it's status in state. If this is not a
   * retry transaction, a nonce will be generated. The transaction is signed
   * using the sign configuration property, then published to the blockchain.
   * A `<tx.id>:finished` hub event is fired after success or failure.
   *
   * @param transactionId - The ID of the transaction to approve.
   * @param traceContext - The parent context for any new traces.
   * @param publishHookOverride - Custom logic to publish the transaction.
   * @returns The state of the approval.
   */
  async #approveTransaction(
    transactionId: string,
    traceContext?: unknown,
    publishHookOverride?: PublishHook,
  ) {
    let clearApprovingTransactionId: (() => void) | undefined;
    let clearNonceLock: (() => void) | undefined;

    let transactionMeta = this.#getTransactionOrThrow(transactionId);

    log('Approving transaction', transactionMeta);

    try {
      if (!this.#sign) {
        this.#failTransaction(
          transactionMeta,
          new Error('No sign method defined.'),
        );
        return ApprovalState.NotApproved;
      } else if (!transactionMeta.chainId) {
        this.#failTransaction(
          transactionMeta,
          new Error('No chainId defined.'),
        );
        return ApprovalState.NotApproved;
      }

      if (this.#approvingTransactionIds.has(transactionId)) {
        log('Skipping approval as signing in progress', transactionId);
        return ApprovalState.NotApproved;
      }

      this.#approvingTransactionIds.add(transactionId);

      clearApprovingTransactionId = () =>
        this.#approvingTransactionIds.delete(transactionId);

      const [nonce, releaseNonce] = await getNextNonce(
        transactionMeta,
        (address: string) =>
          this.#multichainTrackingHelper.getNonceLock(
            address,
            transactionMeta.networkClientId,
          ),
      );

      clearNonceLock = releaseNonce;

      transactionMeta = this.#updateTransactionInternal(
        {
          transactionId,
          note: 'TransactionController#approveTransaction - Transaction approved',
        },
        (draftTxMeta) => {
          const { chainId, txParams } = draftTxMeta;
          const { gas, type } = txParams;

          draftTxMeta.status = TransactionStatus.approved;
          draftTxMeta.txParams.chainId = chainId;
          draftTxMeta.txParams.gasLimit = gas;
          draftTxMeta.txParams.nonce = nonce;

          if (!type && isEIP1559Transaction(txParams)) {
            draftTxMeta.txParams.type = TransactionEnvelopeType.feeMarket;
          }
        },
      );

      this.#onTransactionStatusChange(transactionMeta);

      const rawTx = await this.#trace(
        { name: 'Sign', parentContext: traceContext },
        () => this.#signTransaction(transactionMeta),
      );

      if (!(await this.#beforePublish(transactionMeta))) {
        log('Skipping publishing transaction based on hook');
        this.messagingSystem.publish(
          `${controllerName}:transactionPublishingSkipped`,
          transactionMeta,
        );
        return ApprovalState.SkippedViaBeforePublishHook;
      }

      if (!rawTx && !transactionMeta.isExternalSign) {
        return ApprovalState.NotApproved;
      }

      const { networkClientId } = transactionMeta;
      const ethQuery = this.#getEthQuery({ networkClientId });

      let preTxBalance: string | undefined;
      const shouldUpdatePreTxBalance =
        transactionMeta.type === TransactionType.swap;

      if (shouldUpdatePreTxBalance) {
        log('Determining pre-transaction balance');

        preTxBalance = await query(ethQuery, 'getBalance', [
          transactionMeta.txParams.from,
        ]);
      }

      log('Publishing transaction', transactionMeta.txParams);

      let hash: string | undefined;

      clearNonceLock?.();
      clearNonceLock = undefined;

      if (transactionMeta.batchTransactions?.length) {
        log('Found batch transactions', transactionMeta.batchTransactions);

        const extraTransactionsPublishHook = new ExtraTransactionsPublishHook({
          addTransactionBatch: this.addTransactionBatch.bind(this),
          transactions: transactionMeta.batchTransactions,
        });

        publishHookOverride = extraTransactionsPublishHook.getHook();
      }

      await this.#trace(
        { name: 'Publish', parentContext: traceContext },
        async () => {
          const publishHook = publishHookOverride ?? this.#publish;

          ({ transactionHash: hash } = await publishHook(
            transactionMeta,
            rawTx ?? '0x',
          ));

          if (hash === undefined) {
            hash = await this.#publishTransaction(ethQuery, {
              ...transactionMeta,
              rawTx,
            });
          }
        },
      );

      log('Publish successful', hash);

      transactionMeta = this.#updateTransactionInternal(
        {
          transactionId,
          note: 'TransactionController#approveTransaction - Transaction submitted',
        },
        (draftTxMeta) => {
          draftTxMeta.hash = hash;
          draftTxMeta.status = TransactionStatus.submitted;
          draftTxMeta.submittedTime = new Date().getTime();
          if (shouldUpdatePreTxBalance) {
            draftTxMeta.preTxBalance = preTxBalance;
            log('Updated pre-transaction balance', preTxBalance);
          }
        },
      );

      this.messagingSystem.publish(`${controllerName}:transactionSubmitted`, {
        transactionMeta,
      });

      this.messagingSystem.publish(
        `${controllerName}:transactionFinished`,
        transactionMeta,
      );
      this.#internalEvents.emit(`${transactionId}:finished`, transactionMeta);

      this.#onTransactionStatusChange(transactionMeta);
      return ApprovalState.Approved;
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      this.#failTransaction(transactionMeta, error);
      return ApprovalState.NotApproved;
    } finally {
      clearApprovingTransactionId?.();
      clearNonceLock?.();
    }
  }

  async #publishTransaction(
    ethQuery: EthQuery,
    transactionMeta: TransactionMeta,
    { skipSubmitHistory }: { skipSubmitHistory?: boolean } = {},
  ): Promise<string> {
    const transactionHash = await query(ethQuery, 'sendRawTransaction', [
      transactionMeta.rawTx,
    ]);

    if (skipSubmitHistory !== true) {
      this.#updateSubmitHistory(transactionMeta, transactionHash);
    }

    return transactionHash;
  }

  /**
   * Rejects a transaction based on its ID by setting its status to "rejected"
   * and emitting a `<tx.id>:finished` hub event.
   *
   * @param transactionId - The ID of the transaction to cancel.
   * @param actionId - The actionId passed from UI
   * @param error - The error that caused the rejection.
   */
  #rejectTransaction(transactionId: string, actionId?: string, error?: Error) {
    const transactionMeta = this.#getTransaction(transactionId);

    if (!transactionMeta) {
      return;
    }

    this.#deleteTransaction(transactionId);

    const updatedTransactionMeta: TransactionMeta = {
      ...transactionMeta,
      status: TransactionStatus.rejected as const,
      error: normalizeTxError(error ?? providerErrors.userRejectedRequest()),
    };

    this.messagingSystem.publish(
      `${controllerName}:transactionFinished`,
      updatedTransactionMeta,
    );

    this.#internalEvents.emit(
      `${transactionMeta.id}:finished`,
      updatedTransactionMeta,
    );

    this.messagingSystem.publish(`${controllerName}:transactionRejected`, {
      transactionMeta: updatedTransactionMeta,
      actionId,
    });

    this.#onTransactionStatusChange(updatedTransactionMeta);
  }

  /**
   * Trim the amount of transactions that are set on the state. Checks
   * if the length of the tx history is longer then desired persistence
   * limit and then if it is removes the oldest confirmed or rejected tx.
   * Pending or unapproved transactions will not be removed by this
   * operation. For safety of presenting a fully functional transaction UI
   * representation, this function will not break apart transactions with the
   * same nonce, created on the same day, per network. Not accounting for
   * transactions of the same nonce, same day and network combo can result in
   * confusing or broken experiences in the UI.
   *
   * @param transactions - The transactions to be applied to the state.
   * @returns The trimmed list of transactions.
   */
  #trimTransactionsForState(
    transactions: TransactionMeta[],
  ): TransactionMeta[] {
    const nonceNetworkSet = new Set();

    const txsToKeep = [...transactions]
      .sort((a, b) => (a.time > b.time ? -1 : 1)) // Descending time order
      .filter((tx) => {
        const { chainId, status, txParams, time } = tx;

        if (txParams) {
          const key = `${String(txParams.nonce)}-${convertHexToDecimal(
            chainId,
          )}-${new Date(time).toDateString()}`;

          if (nonceNetworkSet.has(key)) {
            return true;
          } else if (
            nonceNetworkSet.size < this.#transactionHistoryLimit ||
            !this.#isFinalState(status)
          ) {
            nonceNetworkSet.add(key);
            return true;
          }
        }

        return false;
      });

    txsToKeep.reverse(); // Ascending time order
    return txsToKeep;
  }

  /**
   * Determines if the transaction is in a final state.
   *
   * @param status - The transaction status.
   * @returns Whether the transaction is in a final state.
   */
  #isFinalState(status: TransactionStatus): boolean {
    return (
      status === TransactionStatus.rejected ||
      status === TransactionStatus.confirmed ||
      status === TransactionStatus.failed
    );
  }

  /**
   * Whether the transaction has at least completed all local processing.
   *
   * @param status - The transaction status.
   * @returns Whether the transaction is in a final state.
   */
  #isLocalFinalState(status: TransactionStatus): boolean {
    return [
      TransactionStatus.confirmed,
      TransactionStatus.failed,
      TransactionStatus.rejected,
      TransactionStatus.submitted,
    ].includes(status);
  }

  async #requestApproval(
    txMeta: TransactionMeta,
    {
      shouldShowRequest,
      traceContext,
    }: { shouldShowRequest: boolean; traceContext?: TraceContext },
  ): Promise<AddResult> {
    const id = this.#getApprovalId(txMeta);
    const { origin } = txMeta;
    const type = ApprovalType.Transaction;
    const requestData = { txId: txMeta.id };

    await this.#trace({
      name: 'Notification Display',
      id,
      parentContext: traceContext,
    });

    return (await this.messagingSystem.call(
      'ApprovalController:addRequest',
      {
        id,
        origin: origin || ORIGIN_METAMASK,
        type,
        requestData,
        expectsResult: true,
      },
      shouldShowRequest,
    )) as Promise<AddResult>;
  }

  #getTransaction(
    transactionId: string,
  ): Readonly<TransactionMeta> | undefined {
    const { transactions } = this.state;
    return transactions.find(({ id }) => id === transactionId);
  }

  #getTransactionOrThrow(
    transactionId: string,
    errorMessagePrefix = 'TransactionController',
  ): Readonly<TransactionMeta> {
    const txMeta = this.#getTransaction(transactionId);
    if (!txMeta) {
      throw new Error(
        `${errorMessagePrefix}: No transaction found with id ${transactionId}`,
      );
    }
    return txMeta;
  }

  #getApprovalId(txMeta: TransactionMeta) {
    return String(txMeta.id);
  }

  #isTransactionCompleted(transactionId: string): {
    meta?: TransactionMeta;
    isCompleted: boolean;
  } {
    const transaction = this.#getTransaction(transactionId);

    if (!transaction) {
      return { meta: undefined, isCompleted: false };
    }

    const isCompleted = this.#isLocalFinalState(transaction.status);

    return { meta: transaction, isCompleted };
  }

  #getChainId(networkClientId: NetworkClientId): Hex {
    return this.#multichainTrackingHelper.getNetworkClient({ networkClientId })
      .configuration.chainId;
  }

  #getNetworkClientId({
    chainId,
    networkClientId,
  }: {
    chainId?: Hex;
    networkClientId?: NetworkClientId;
  }) {
    if (networkClientId) {
      return networkClientId;
    }

    return this.#multichainTrackingHelper.getNetworkClient({
      chainId,
    }).id;
  }

  #getEthQuery({
    chainId,
    networkClientId,
  }: {
    chainId?: Hex;
    networkClientId?: NetworkClientId;
  }): EthQuery {
    return new EthQuery(this.#getProvider({ chainId, networkClientId }));
  }

  #getProvider({
    chainId,
    networkClientId,
  }: {
    chainId?: Hex;
    networkClientId?: NetworkClientId;
  }): Provider {
    return this.#multichainTrackingHelper.getNetworkClient({
      chainId,
      networkClientId,
    }).provider;
  }

  #onIncomingTransactions(transactions: TransactionMeta[]) {
    if (!transactions.length) {
      return;
    }

    const finalTransactions: TransactionMeta[] = [];

    for (const tx of transactions) {
      const { chainId } = tx;

      try {
        const networkClientId = this.#getNetworkClientId({ chainId });

        finalTransactions.push({
          ...tx,
          networkClientId,
        });
      } catch (error) {
        log('Failed to get network client ID for incoming transaction', {
          chainId,
          error,
        });
      }
    }

    this.update((state) => {
      const { transactions: currentTransactions } = state;

      state.transactions = this.#trimTransactionsForState([
        ...finalTransactions,
        ...currentTransactions,
      ]);

      log(
        'Added incoming transactions to state',
        finalTransactions.length,
        finalTransactions,
      );
    });

    this.messagingSystem.publish(
      `${controllerName}:incomingTransactionsReceived`,
      finalTransactions,
    );
  }

  #generateDappSuggestedGasFees(
    txParams: TransactionParams,
    origin?: string,
  ): DappSuggestedGasFees | undefined {
    if (!origin || origin === ORIGIN_METAMASK) {
      return undefined;
    }

    const { gasPrice, maxFeePerGas, maxPriorityFeePerGas, gas } = txParams;

    if (
      gasPrice === undefined &&
      maxFeePerGas === undefined &&
      maxPriorityFeePerGas === undefined &&
      gas === undefined
    ) {
      return undefined;
    }

    const dappSuggestedGasFees: DappSuggestedGasFees = {};

    if (gasPrice !== undefined) {
      dappSuggestedGasFees.gasPrice = gasPrice;
    } else if (
      maxFeePerGas !== undefined ||
      maxPriorityFeePerGas !== undefined
    ) {
      dappSuggestedGasFees.maxFeePerGas = maxFeePerGas;
      dappSuggestedGasFees.maxPriorityFeePerGas = maxPriorityFeePerGas;
    }

    if (gas !== undefined) {
      dappSuggestedGasFees.gas = gas;
    }

    return dappSuggestedGasFees;
  }

  /**
   * Validates and adds external provided transaction to state.
   *
   * @param transactionMeta - Nominated external transaction to be added to state.
   * @returns The new transaction.
   */
  #addExternalTransaction(transactionMeta: TransactionMeta) {
    const { chainId } = transactionMeta;
    const { transactions } = this.state;
    const fromAddress = transactionMeta?.txParams?.from;
    const sameFromAndNetworkTransactions = transactions.filter(
      (transaction) =>
        transaction.txParams.from === fromAddress &&
        transaction.chainId === chainId,
    );
    const confirmedTxs = sameFromAndNetworkTransactions.filter(
      (transaction) => transaction.status === TransactionStatus.confirmed,
    );
    const pendingTxs = sameFromAndNetworkTransactions.filter(
      (transaction) => transaction.status === TransactionStatus.submitted,
    );

    validateConfirmedExternalTransaction(
      transactionMeta,
      confirmedTxs,
      pendingTxs,
    );

    // Make sure provided external transaction has non empty history array
    const newTransactionMeta =
      (transactionMeta.history ?? []).length === 0 && !this.#isHistoryDisabled
        ? addInitialHistorySnapshot(transactionMeta)
        : transactionMeta;

    this.update((state) => {
      state.transactions = this.#trimTransactionsForState([
        ...state.transactions,
        newTransactionMeta,
      ]);
    });

    return newTransactionMeta;
  }

  /**
   * Sets other txMeta statuses to dropped if the txMeta that has been confirmed has other transactions
   * in the transactions have the same nonce.
   *
   * @param transactionId - Used to identify original transaction.
   */
  #markNonceDuplicatesDropped(transactionId: string) {
    const transactionMeta = this.#getTransaction(transactionId);
    if (!transactionMeta) {
      return;
    }
    const nonce = transactionMeta.txParams?.nonce;
    const from = transactionMeta.txParams?.from;
    const { chainId } = transactionMeta;

    const sameNonceTransactions = this.state.transactions.filter(
      (transaction) =>
        transaction.id !== transactionId &&
        transaction.txParams.from === from &&
        nonce &&
        transaction.txParams.nonce === nonce &&
        transaction.chainId === chainId &&
        transaction.type !== TransactionType.incoming,
    );
    const sameNonceTransactionIds = sameNonceTransactions.map(
      (transaction) => transaction.id,
    );

    if (sameNonceTransactions.length === 0) {
      return;
    }

    this.update((state) => {
      for (const transaction of state.transactions) {
        if (sameNonceTransactionIds.includes(transaction.id)) {
          transaction.replacedBy = transactionMeta?.hash;
          transaction.replacedById = transactionMeta?.id;
        }
      }
    });

    for (const transaction of this.state.transactions) {
      if (
        sameNonceTransactionIds.includes(transaction.id) &&
        transaction.status !== TransactionStatus.failed
      ) {
        this.#setTransactionStatusDropped(transaction);
      }
    }
  }

  /**
   * Method to set transaction status to dropped.
   *
   * @param transactionMeta - TransactionMeta of transaction to be marked as dropped.
   */
  #setTransactionStatusDropped(transactionMeta: TransactionMeta) {
    const updatedTransactionMeta = {
      ...transactionMeta,
      status: TransactionStatus.dropped as const,
    };
    this.messagingSystem.publish(`${controllerName}:transactionDropped`, {
      transactionMeta: updatedTransactionMeta,
    });
    this.updateTransaction(
      updatedTransactionMeta,
      'TransactionController#setTransactionStatusDropped - Transaction dropped',
    );
    this.#onTransactionStatusChange(updatedTransactionMeta);
  }

  /**
   * Get transaction with provided actionId.
   *
   * @param actionId - Unique ID to prevent duplicate requests
   * @returns the filtered transaction
   */
  #getTransactionWithActionId(actionId?: string) {
    return this.state.transactions.find(
      (transaction) => actionId && transaction.actionId === actionId,
    );
  }

  async #waitForTransactionFinished(
    transactionId: string,
  ): Promise<TransactionMeta> {
    return new Promise((resolve) => {
      this.#internalEvents.once(`${transactionId}:finished`, (txMeta) => {
        resolve(txMeta);
      });
    });
  }

  /**
   * Updates the r, s, and v properties of a TransactionMeta object
   * with values from a signed transaction.
   *
   * @param transactionMeta - The TransactionMeta object to update.
   * @param signedTx - The encompassing type for all transaction types containing r, s, and v values.
   * @returns The updated TransactionMeta object.
   */
  #updateTransactionMetaRSV(
    transactionMeta: TransactionMeta,
    signedTx: TypedTransaction,
  ): TransactionMeta {
    const transactionMetaWithRsv = cloneDeep(transactionMeta);

    for (const key of ['r', 's', 'v'] as const) {
      const value = signedTx[key];

      if (value === undefined || value === null) {
        continue;
      }

      transactionMetaWithRsv[key] = add0x(value.toString(16));
    }

    return transactionMetaWithRsv;
  }

  async #getEIP1559Compatibility(networkClientId?: NetworkClientId) {
    const currentNetworkIsEIP1559Compatible =
      await this.#getCurrentNetworkEIP1559Compatibility(networkClientId);

    const currentAccountIsEIP1559Compatible =
      await this.#getCurrentAccountEIP1559Compatibility();

    return (
      currentNetworkIsEIP1559Compatible && currentAccountIsEIP1559Compatible
    );
  }

  async #signTransaction(
    transactionMeta: TransactionMeta,
  ): Promise<string | undefined> {
    const {
      chainId,
      id: transactionId,
      isExternalSign,
      txParams,
    } = transactionMeta;

    if (isExternalSign) {
      log('Skipping sign as signed externally');
      return undefined;
    }

    const { authorizationList, from } = txParams;

    const signedAuthorizationList = await signAuthorizationList({
      authorizationList,
      messenger: this.messagingSystem,
      transactionMeta,
    });

    if (signedAuthorizationList) {
      this.#updateTransactionInternal({ transactionId }, (txMeta) => {
        txMeta.txParams.authorizationList = signedAuthorizationList;
      });
    }

    log('Calling before sign hook', transactionMeta);

    const { updateTransaction } =
      (await this.#beforeSign({ transactionMeta })) ?? {};

    if (updateTransaction) {
      this.#updateTransactionInternal(
        { transactionId, skipResimulateCheck: true, note: 'beforeSign Hook' },
        updateTransaction,
      );

      log('Updated transaction after before sign hook');
    }

    const finalTransactionMeta = this.#getTransactionOrThrow(transactionId);
    const { txParams: finalTxParams } = finalTransactionMeta;
    const unsignedEthTx = prepareTransaction(chainId, finalTxParams);

    this.#approvingTransactionIds.add(transactionId);

    log('Signing transaction', finalTxParams);

    const signedTx = await new Promise<TypedTransaction>((resolve, reject) => {
      this.#sign?.(
        unsignedEthTx,
        from,
        ...this.#getAdditionalSignArguments(finalTransactionMeta),
      ).then(resolve, reject);

      this.#signAbortCallbacks.set(transactionId, () =>
        reject(new Error('Signing aborted by user')),
      );
    });

    this.#signAbortCallbacks.delete(transactionId);

    if (!signedTx) {
      log('Skipping signed status as no signed transaction');
      return undefined;
    }

    const transactionMetaFromHook = cloneDeep(finalTransactionMeta);

    if (!this.#afterSign(transactionMetaFromHook, signedTx)) {
      this.updateTransaction(
        transactionMetaFromHook,
        'TransactionController#signTransaction - Update after sign',
      );

      log('Skipping signed status based on hook');

      return undefined;
    }

    const transactionMetaWithRsv = {
      ...this.#updateTransactionMetaRSV(transactionMetaFromHook, signedTx),
      status: TransactionStatus.signed as const,
      txParams: finalTxParams,
    };

    this.updateTransaction(
      transactionMetaWithRsv,
      'TransactionController#approveTransaction - Transaction signed',
    );

    this.#onTransactionStatusChange(transactionMetaWithRsv);

    const rawTx = serializeTransaction(signedTx);

    const transactionMetaWithRawTx = merge({}, transactionMetaWithRsv, {
      rawTx,
    });

    this.updateTransaction(
      transactionMetaWithRawTx,
      'TransactionController#approveTransaction - RawTransaction added',
    );

    return rawTx;
  }

  #onTransactionStatusChange(transactionMeta: TransactionMeta) {
    this.messagingSystem.publish(`${controllerName}:transactionStatusUpdated`, {
      transactionMeta,
    });
  }

  #getNonceTrackerTransactions(
    statuses: TransactionStatus[],
    address: string,
    chainId: string,
  ) {
    return getAndFormatTransactionsForNonceTracker(
      chainId,
      address,
      statuses,
      this.state.transactions,
    );
  }

  #onConfirmedTransaction(transactionMeta: TransactionMeta) {
    log('Processing confirmed transaction', transactionMeta.id);

    this.#markNonceDuplicatesDropped(transactionMeta.id);

    this.messagingSystem.publish(
      `${controllerName}:transactionConfirmed`,
      transactionMeta,
    );

    this.#onTransactionStatusChange(transactionMeta);

    // Intentional given potential duration of process.
    this.#updatePostBalance(transactionMeta).catch((error) => {
      log('Error while updating post balance', error);
      throw error;
    });
  }

  async #updatePostBalance(transactionMeta: TransactionMeta) {
    try {
      const { networkClientId, type } = transactionMeta;

      if (type !== TransactionType.swap) {
        return;
      }

      const ethQuery = this.#getEthQuery({ networkClientId });

      const { updatedTransactionMeta, approvalTransactionMeta } =
        await updatePostTransactionBalance(transactionMeta, {
          ethQuery,
          getTransaction: this.#getTransaction.bind(this),
          updateTransaction: this.updateTransaction.bind(this),
        });

      this.messagingSystem.publish(
        `${controllerName}:postTransactionBalanceUpdated`,
        {
          transactionMeta: updatedTransactionMeta,
          approvalTransactionMeta,
        },
      );
    } catch (error) {
      /* istanbul ignore next */
      log('Error while updating post transaction balance', error);
    }
  }

  #createNonceTracker({
    provider,
    blockTracker,
    chainId,
  }: {
    provider: Provider;
    blockTracker: BlockTracker;
    chainId: Hex;
  }): NonceTracker {
    return new NonceTracker({
      // TODO: Fix types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      provider: provider as any,
      // TODO: Fix types
      blockTracker,
      getPendingTransactions: this.#getNonceTrackerPendingTransactions.bind(
        this,
        chainId,
      ),
      getConfirmedTransactions: this.#getNonceTrackerTransactions.bind(
        this,
        [TransactionStatus.confirmed],
        chainId,
      ),
    });
  }

  #createPendingTransactionTracker({
    provider,
    blockTracker,
    chainId,
    networkClientId,
  }: {
    provider: Provider;
    blockTracker: BlockTracker;
    chainId: Hex;
    networkClientId: NetworkClientId;
  }): PendingTransactionTracker {
    const ethQuery = new EthQuery(provider);

    const pendingTransactionTracker = new PendingTransactionTracker({
      blockTracker,
      getChainId: () => chainId,
      getEthQuery: () => ethQuery,
      getNetworkClientId: () => networkClientId,
      getTransactions: () => this.state.transactions,
      isResubmitEnabled: this.#pendingTransactionOptions.isResubmitEnabled,
      getGlobalLock: () =>
        this.#multichainTrackingHelper.acquireNonceLockForChainIdKey({
          chainId,
        }),
      messenger: this.messagingSystem,
      publishTransaction: (_ethQuery, transactionMeta) =>
        this.#publishTransaction(_ethQuery, transactionMeta, {
          skipSubmitHistory: true,
        }),
      hooks: {
        beforeCheckPendingTransaction:
          this.#beforeCheckPendingTransaction.bind(this),
      },
    });

    this.#addPendingTransactionTrackerListeners(pendingTransactionTracker);

    return pendingTransactionTracker;
  }

  readonly #checkForPendingTransactionAndStartPolling = () => {
    this.#multichainTrackingHelper.checkForPendingTransactionAndStartPolling();
  };

  #stopAllTracking() {
    this.#multichainTrackingHelper.stopAllTracking();
  }

  #addIncomingTransactionHelperListeners(
    incomingTransactionHelper: IncomingTransactionHelper,
  ) {
    incomingTransactionHelper.hub.on(
      'transactions',
      this.#onIncomingTransactions.bind(this),
    );
  }

  #removePendingTransactionTrackerListeners(
    pendingTransactionTracker: PendingTransactionTracker,
  ) {
    pendingTransactionTracker.hub.removeAllListeners('transaction-confirmed');
    pendingTransactionTracker.hub.removeAllListeners('transaction-dropped');
    pendingTransactionTracker.hub.removeAllListeners('transaction-failed');
    pendingTransactionTracker.hub.removeAllListeners('transaction-updated');
  }

  #addPendingTransactionTrackerListeners(
    pendingTransactionTracker: PendingTransactionTracker,
  ) {
    pendingTransactionTracker.hub.on(
      'transaction-confirmed',
      this.#onConfirmedTransaction.bind(this),
    );

    pendingTransactionTracker.hub.on(
      'transaction-dropped',
      this.#setTransactionStatusDropped.bind(this),
    );

    pendingTransactionTracker.hub.on(
      'transaction-failed',
      this.#failTransaction.bind(this),
    );

    pendingTransactionTracker.hub.on(
      'transaction-updated',
      this.updateTransaction.bind(this),
    );
  }

  #getNonceTrackerPendingTransactions(chainId: string, address: string) {
    const standardPendingTransactions = this.#getNonceTrackerTransactions(
      [
        TransactionStatus.approved,
        TransactionStatus.signed,
        TransactionStatus.submitted,
      ],
      address,
      chainId,
    );

    const externalPendingTransactions = this.#getExternalPendingTransactions(
      address,
      chainId,
    );
    return [...standardPendingTransactions, ...externalPendingTransactions];
  }

  async #publishTransactionForRetry(
    ethQuery: EthQuery,
    transactionMeta: TransactionMeta,
  ): Promise<string> {
    try {
      return await this.#publishTransaction(ethQuery, transactionMeta);
    } catch (error: unknown) {
      if (this.#isTransactionAlreadyConfirmedError(error as Error)) {
        throw new Error('Previous transaction is already confirmed');
      }
      throw error;
    }
  }

  /**
   * Ensures that error is a nonce issue
   *
   * @param error - The error to check
   * @returns Whether or not the error is a nonce issue
   */
  // TODO: Replace `any` with type
  // Some networks are returning original error in the data field
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  #isTransactionAlreadyConfirmedError(error: any): boolean {
    return (
      error?.message?.includes('nonce too low') ||
      error?.data?.message?.includes('nonce too low')
    );
  }

  #getGasFeeFlows(): GasFeeFlow[] {
    if (this.#testGasFeeFlows) {
      return [new TestGasFeeFlow()];
    }

    return [
      new RandomisedEstimationsGasFeeFlow(),
      new LineaGasFeeFlow(),
      new DefaultGasFeeFlow(),
    ];
  }

  #getLayer1GasFeeFlows(): Layer1GasFeeFlow[] {
    return [new OptimismLayer1GasFeeFlow(), new ScrollLayer1GasFeeFlow()];
  }

  #updateTransactionInternal(
    {
      transactionId,
      note,
      skipHistory,
      skipValidation,
      skipResimulateCheck,
    }: {
      transactionId: string;
      note?: string;
      skipHistory?: boolean;
      skipValidation?: boolean;
      skipResimulateCheck?: boolean;
    },
    callback: (transactionMeta: TransactionMeta) => TransactionMeta | void,
  ): Readonly<TransactionMeta> {
    let resimulateResponse: ResimulateResponse | undefined;

    this.update((state) => {
      const index = state.transactions.findIndex(
        ({ id }) => id === transactionId,
      );

      if (index === -1) {
        throw new Error(
          `Cannot update transaction as ID not found - ${transactionId}`,
        );
      }

      let transactionMeta = state.transactions[index];

      const originalTransactionMeta = cloneDeep(transactionMeta);

      transactionMeta = callback(transactionMeta) ?? transactionMeta;

      if (skipValidation !== true) {
        transactionMeta.txParams = normalizeTransactionParams(
          transactionMeta.txParams,
        );

        validateTxParams(transactionMeta.txParams);
      }

      if (!skipResimulateCheck && this.#isSimulationEnabled()) {
        resimulateResponse = shouldResimulate(
          originalTransactionMeta,
          transactionMeta,
        );
      }

      const shouldSkipHistory = this.#isHistoryDisabled || skipHistory;

      if (!shouldSkipHistory) {
        transactionMeta = updateTransactionHistory(
          transactionMeta,
          note ?? 'Transaction updated',
        );
      }
      state.transactions[index] = transactionMeta;
    });

    const transactionMeta = this.#getTransaction(
      transactionId,
    ) as TransactionMeta;

    if (resimulateResponse?.resimulate) {
      this.#updateSimulationData(transactionMeta, {
        blockTime: resimulateResponse.blockTime,
      }).catch((error) => {
        log('Error during re-simulation', error);
        throw error;
      });
    }

    return transactionMeta;
  }

  async #updateFirstTimeInteraction(
    transactionMeta: TransactionMeta,
    {
      traceContext,
    }: {
      traceContext?: TraceContext;
    } = {},
  ) {
    if (!this.#isFirstTimeInteractionEnabled()) {
      return;
    }

    const {
      chainId,
      id: transactionId,
      txParams: { to, from },
    } = transactionMeta;

    const request: GetAccountAddressRelationshipRequest = {
      chainId: hexToNumber(chainId),
      to: to as string,
      from,
    };

    validateParamTo(to);

    const existingTransaction = this.state.transactions.find(
      (tx) =>
        tx.chainId === chainId &&
        tx.txParams.from === from &&
        tx.txParams.to === to &&
        tx.id !== transactionId,
    );

    // Check if there is an existing transaction with the same from, to, and chainId
    // else we continue to check the account address relationship from API
    if (existingTransaction) {
      return;
    }

    try {
      const { count } = await this.#trace(
        { name: 'Account Address Relationship', parentContext: traceContext },
        () => getAccountAddressRelationship(request),
      );

      const isFirstTimeInteraction =
        count === undefined ? undefined : count === 0;

      const finalTransactionMeta = this.#getTransaction(transactionId);

      /* istanbul ignore if */
      if (!finalTransactionMeta) {
        log(
          'Cannot update first time interaction as transaction not found',
          transactionId,
        );
        return;
      }

      this.#updateTransactionInternal(
        {
          transactionId,
          note: 'TransactionController#updateFirstInteraction - Update first time interaction',
        },
        (txMeta) => {
          txMeta.isFirstTimeInteraction = isFirstTimeInteraction;
        },
      );

      log('Updated first time interaction', transactionId, {
        isFirstTimeInteraction,
      });
    } catch (error) {
      log(
        'Error fetching account address relationship, skipping first time interaction update',
        error,
      );
    }
  }

  async #updateSimulationData(
    transactionMeta: TransactionMeta,
    {
      blockTime,
      traceContext,
    }: {
      blockTime?: number;
      traceContext?: TraceContext;
    } = {},
  ) {
    const {
      chainId,
      id: transactionId,
      nestedTransactions,
      networkClientId,
      simulationData: prevSimulationData,
      txParams,
    } = transactionMeta;

    let simulationData: SimulationData = {
      error: {
        code: SimulationErrorCode.Disabled,
        message: 'Simulation disabled',
      },
      tokenBalanceChanges: [],
    };

    let gasFeeTokens: GasFeeToken[] = [];

    const isBalanceChangesSkipped =
      this.#skipSimulationTransactionIds.has(transactionId);

    if (this.#isSimulationEnabled() && !isBalanceChangesSkipped) {
      simulationData = await this.#trace(
        { name: 'Simulate', parentContext: traceContext },
        () =>
          getBalanceChanges({
            blockTime,
            chainId,
            ethQuery: this.#getEthQuery({ networkClientId }),
            nestedTransactions,
            txParams,
          }),
      );

      if (
        blockTime &&
        prevSimulationData &&
        hasSimulationDataChanged(prevSimulationData, simulationData)
      ) {
        simulationData = {
          ...simulationData,
          isUpdatedAfterSecurityCheck: true,
        };
      }

      gasFeeTokens = await getGasFeeTokens({
        chainId,
        isEIP7702GasFeeTokensEnabled: this.#isEIP7702GasFeeTokensEnabled,
        messenger: this.messagingSystem,
        publicKeyEIP7702: this.#publicKeyEIP7702,
        transactionMeta,
      });
    }

    const latestTransactionMeta = this.#getTransaction(transactionId);

    /* istanbul ignore if */
    if (!latestTransactionMeta) {
      log(
        'Cannot update simulation data as transaction not found',
        transactionId,
        simulationData,
      );

      return;
    }

    const updatedTransactionMeta = this.#updateTransactionInternal(
      {
        transactionId,
        note: 'TransactionController#updateSimulationData - Update simulation data',
        skipResimulateCheck: Boolean(blockTime),
      },
      (txMeta) => {
        txMeta.gasFeeTokens = gasFeeTokens;

        if (!isBalanceChangesSkipped) {
          txMeta.simulationData = simulationData;
        }
      },
    );

    log('Updated simulation data', transactionId, updatedTransactionMeta);

    await this.#runAfterSimulateHook(updatedTransactionMeta);
  }

  #onGasFeePollerTransactionUpdate({
    transactionId,
    gasFeeEstimates,
    gasFeeEstimatesLoaded,
    layer1GasFee,
  }: {
    transactionId: string;
    gasFeeEstimates?: GasFeeEstimates;
    gasFeeEstimatesLoaded?: boolean;
    layer1GasFee?: Hex;
  }) {
    this.#updateTransactionInternal(
      { transactionId, skipHistory: true },
      (txMeta) => {
        updateTransactionGasProperties({
          txMeta,
          gasFeeEstimates,
          gasFeeEstimatesLoaded,
          isTxParamsGasFeeUpdatesEnabled: this.#isAutomaticGasFeeUpdateEnabled,
          layer1GasFee,
        });
      },
    );
  }

  #onGasFeePollerTransactionBatchUpdate({
    transactionBatchId,
    gasFeeEstimates,
  }: {
    transactionBatchId: Hex;
    gasFeeEstimates?: GasFeeEstimates;
  }) {
    this.#updateTransactionBatch(transactionBatchId, (batch) => {
      return { ...batch, gasFeeEstimates };
    });
  }

  #updateTransactionBatch(
    batchId: string,
    callback: (batch: TransactionBatchMeta) => TransactionBatchMeta | void,
  ): void {
    this.update((state) => {
      const index = state.transactionBatches.findIndex((b) => b.id === batchId);

      if (index === -1) {
        throw new Error(`Cannot update batch, ID not found - ${batchId}`);
      }

      const batch = state.transactionBatches[index];
      const updated = callback(batch);

      state.transactionBatches[index] = updated ?? batch;
    });
  }

  #getSelectedAccount() {
    return this.messagingSystem.call('AccountsController:getSelectedAccount');
  }

  #getInternalAccounts(): Hex[] {
    const state = this.messagingSystem.call('AccountsController:getState');

    return Object.values(state.internalAccounts?.accounts ?? {})
      .filter((account) => account.type === 'eip155:eoa')
      .map((account) => account.address as Hex);
  }

  #updateSubmitHistory(transactionMeta: TransactionMeta, hash: string): void {
    const { chainId, networkClientId, origin, rawTx, txParams } =
      transactionMeta;

    const { networkConfigurationsByChainId } = this.#getNetworkState();
    const networkConfiguration = networkConfigurationsByChainId[chainId as Hex];

    const endpoint = networkConfiguration?.rpcEndpoints.find(
      (currentEndpoint) => currentEndpoint.networkClientId === networkClientId,
    );

    const networkUrl = endpoint?.url;
    const networkType = endpoint?.name ?? networkClientId;

    const submitHistoryEntry: SubmitHistoryEntry = {
      chainId,
      hash,
      networkType,
      networkUrl,
      origin,
      rawTransaction: rawTx as string,
      time: Date.now(),
      transaction: txParams,
    };

    log('Updating submit history', submitHistoryEntry);

    this.update((state) => {
      const { submitHistory } = state;

      if (submitHistory.length === SUBMIT_HISTORY_LIMIT) {
        submitHistory.pop();
      }

      submitHistory.unshift(submitHistoryEntry);
    });
  }

  async #updateGasEstimate(transactionMeta: TransactionMeta) {
    const { chainId, networkClientId } = transactionMeta;

    const isCustomNetwork =
      this.#multichainTrackingHelper.getNetworkClient({ networkClientId })
        .configuration.type === NetworkClientType.Custom;

    const ethQuery = this.#getEthQuery({ networkClientId });

    await updateGas({
      chainId,
      ethQuery,
      isCustomNetwork,
      isSimulationEnabled: this.#isSimulationEnabled(),
      messenger: this.messagingSystem,
      txMeta: transactionMeta,
    });
  }

  #registerActionHandlers(): void {
    this.messagingSystem.registerActionHandler(
      `${controllerName}:estimateGas`,
      this.estimateGas.bind(this),
    );

    this.messagingSystem.registerActionHandler(
      `${controllerName}:updateCustodialTransaction`,
      this.updateCustodialTransaction.bind(this),
    );
  }

  #deleteTransaction(transactionId: string) {
    this.update((state) => {
      const transactions = state.transactions.filter(
        ({ id }) => id !== transactionId,
      );

      state.transactions = this.#trimTransactionsForState(transactions);
    });
  }

  #isRejectError(error: Error & { code?: number }) {
    return [
      errorCodes.provider.userRejectedRequest,
      ErrorCode.RejectedUpgrade,
    ].includes(error.code as number);
  }

  #rejectTransactionAndThrow(
    transactionId: string,
    actionId: string | undefined,
    error: Error & { code?: number; data?: Json },
  ) {
    this.#rejectTransaction(transactionId, actionId, error);

    if (error.code === errorCodes.provider.userRejectedRequest) {
      throw providerErrors.userRejectedRequest({
        message: 'MetaMask Tx Signature: User denied transaction signature.',
        data: error?.data,
      });
    }

    throw error;
  }

  #failTransaction(
    transactionMeta: TransactionMeta,
    error: Error,
    actionId?: string,
  ) {
    let newTransactionMeta: TransactionMeta;

    try {
      newTransactionMeta = this.#updateTransactionInternal(
        {
          transactionId: transactionMeta.id,
          note: 'TransactionController#failTransaction - Add error message and set status to failed',
          skipValidation: true,
        },
        (draftTransactionMeta) => {
          draftTransactionMeta.status = TransactionStatus.failed;

          (
            draftTransactionMeta as TransactionMeta & {
              status: TransactionStatus.failed;
            }
          ).error = normalizeTxError(error);
        },
      );
    } catch (err: unknown) {
      log('Failed to mark transaction as failed', err);

      newTransactionMeta = {
        ...transactionMeta,
        status: TransactionStatus.failed,
        error: normalizeTxError(error),
      };
    }

    this.messagingSystem.publish(`${controllerName}:transactionFailed`, {
      actionId,
      error: error.message,
      transactionMeta: newTransactionMeta,
    });

    this.#onTransactionStatusChange(newTransactionMeta);

    this.messagingSystem.publish(
      `${controllerName}:transactionFinished`,
      newTransactionMeta,
    );

    this.#internalEvents.emit(
      `${transactionMeta.id}:finished`,
      newTransactionMeta,
    );
  }

  async #runAfterSimulateHook(transactionMeta: TransactionMeta) {
    log('Calling afterSimulate hook', transactionMeta);

    const { id: transactionId } = transactionMeta;

    const result = await this.#afterSimulate({
      transactionMeta,
    });

    const { skipSimulation, updateTransaction } = result || {};

    if (skipSimulation) {
      this.#skipSimulationTransactionIds.add(transactionId);
    } else if (skipSimulation === false) {
      this.#skipSimulationTransactionIds.delete(transactionId);
    }

    if (!updateTransaction) {
      return;
    }

    const updatedTransactionMeta = this.#updateTransactionInternal(
      {
        transactionId,
        skipResimulateCheck: true,
        note: 'afterSimulate Hook',
      },
      (txMeta) => {
        txMeta.txParamsOriginal = cloneDeep(txMeta.txParams);
        updateTransaction(txMeta);
      },
    );

    log('Updated transaction with afterSimulate data', updatedTransactionMeta);
  }
}
