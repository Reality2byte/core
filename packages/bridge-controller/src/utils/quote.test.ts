import { AddressZero } from '@ethersproject/constants';
import { convertHexToDecimal } from '@metamask/controller-utils';
import { BigNumber } from 'bignumber.js';

import {
  isValidQuoteRequest,
  getQuoteIdentifier,
  calcSolanaTotalNetworkFee,
  calcToAmount,
  calcSentAmount,
  calcRelayerFee,
  calcEstimatedAndMaxTotalGasFee,
  calcTotalEstimatedNetworkFee,
  calcTotalMaxNetworkFee,
  calcAdjustedReturn,
  calcSwapRate,
  calcCost,
  formatEtaInMinutes,
  calcSlippagePercentage,
} from './quote';
import type {
  GenericQuoteRequest,
  QuoteResponse,
  Quote,
  SolanaFees,
  L1GasFees,
  TxData,
} from '../types';

describe('Quote Utils', () => {
  describe('isValidQuoteRequest', () => {
    const validRequest: GenericQuoteRequest = {
      srcTokenAddress: '0x123',
      destTokenAddress: '0x456',
      srcChainId: '1',
      destChainId: '137',
      walletAddress: '0x789',
      srcTokenAmount: '1000',
      slippage: 0.5,
      gasIncluded: false,
    };

    it('should return true for valid request with all required fields', () => {
      expect(isValidQuoteRequest(validRequest)).toBe(true);
    });

    it('should return false if any required string field is missing', () => {
      const requiredFields = [
        'srcTokenAddress',
        'destTokenAddress',
        'srcChainId',
        'destChainId',
        'walletAddress',
        'srcTokenAmount',
      ];

      requiredFields.forEach((field) => {
        const invalidRequest = { ...validRequest };
        delete invalidRequest[field as keyof GenericQuoteRequest];
        expect(isValidQuoteRequest(invalidRequest)).toBe(false);
      });
    });

    it('should return false if any required string field is empty', () => {
      const requiredFields = [
        'srcTokenAddress',
        'destTokenAddress',
        'srcChainId',
        'destChainId',
        'walletAddress',
        'srcTokenAmount',
      ];

      requiredFields.forEach((field) => {
        const invalidRequest = {
          ...validRequest,
          [field]: '',
        };
        expect(isValidQuoteRequest(invalidRequest)).toBe(false);
      });
    });

    it('should return false if any required string field is null', () => {
      const invalidRequest = {
        ...validRequest,
        srcTokenAddress: null,
      };
      expect(isValidQuoteRequest(invalidRequest as never)).toBe(false);
    });

    it('should return false if srcTokenAmount is not a valid positive integer', () => {
      const invalidAmounts = ['0', '-1', '1.5', 'abc', '01'];
      invalidAmounts.forEach((amount) => {
        const invalidRequest = {
          ...validRequest,
          srcTokenAmount: amount,
        };
        expect(isValidQuoteRequest(invalidRequest)).toBe(false);
      });
    });

    it('should return true for valid srcTokenAmount values', () => {
      const validAmounts = ['1', '100', '999999'];
      validAmounts.forEach((amount) => {
        const validAmountRequest = {
          ...validRequest,
          srcTokenAmount: amount,
        };
        expect(isValidQuoteRequest(validAmountRequest)).toBe(true);
      });
    });

    it('should validate request without amount when requireAmount is false', () => {
      const { srcTokenAmount, ...requestWithoutAmount } = validRequest;
      expect(isValidQuoteRequest(requestWithoutAmount, false)).toBe(true);
    });

    describe('slippage validation', () => {
      it('should return true when slippage is a valid number', () => {
        const requestWithSlippage = {
          ...validRequest,
          slippage: 1.5,
        };
        expect(isValidQuoteRequest(requestWithSlippage)).toBe(true);
      });

      it('should return false when slippage is NaN', () => {
        const requestWithInvalidSlippage = {
          ...validRequest,
          slippage: NaN,
        };
        expect(isValidQuoteRequest(requestWithInvalidSlippage)).toBe(false);
      });

      it('should return false when slippage is null', () => {
        const requestWithInvalidSlippage = {
          ...validRequest,
          slippage: null,
        };
        expect(isValidQuoteRequest(requestWithInvalidSlippage as never)).toBe(
          false,
        );
      });

      it('should return true when slippage is undefined', () => {
        const requestWithoutSlippage = { ...validRequest };
        delete requestWithoutSlippage.slippage;
        expect(isValidQuoteRequest(requestWithoutSlippage)).toBe(true);
      });
    });
  });
});

describe('Quote Metadata Utils', () => {
  describe('getQuoteIdentifier', () => {
    it('should generate correct identifier from quote', () => {
      const quote = {
        bridgeId: 'bridge1',
        bridges: ['bridge-a'],
        steps: ['step1', 'step2'],
      } as unknown as Quote;
      expect(getQuoteIdentifier(quote)).toBe('bridge1-bridge-a-2');
    });
  });

  describe('calcSentAmount', () => {
    it('should calculate sent amount correctly with exchange rates', () => {
      const mockQuote: Quote = {
        srcTokenAmount: '12555423',
        srcAsset: { decimals: 6 },
        feeData: {
          metabridge: { amount: '100000000' },
        },
      } as Quote;
      const result = calcSentAmount(mockQuote, {
        exchangeRate: '2.14',
        usdExchangeRate: '1.5',
      });

      expect(result.amount).toBe('112.555423');
      expect(result.valueInCurrency).toBe('240.86860522');
      expect(result.usd).toBe('168.8331345');
    });

    it('should handle missing exchange rates', () => {
      const mockQuote: Quote = {
        srcTokenAmount: '1000000000',
        srcAsset: { decimals: 6 },
        feeData: {
          metabridge: { amount: '100000000' },
        },
      } as Quote;
      const result = calcSentAmount(mockQuote, {});

      expect(result.amount).toBe('1100');
      expect(result.valueInCurrency).toBeNull();
      expect(result.usd).toBeNull();
    });

    it('should handle zero values', () => {
      const mockQuote: Quote = {
        srcTokenAmount: '0',
        srcAsset: { decimals: 6 },
        feeData: {
          metabridge: { amount: '0' },
        },
      } as Quote;
      const zeroQuote = {
        ...mockQuote,
        srcTokenAmount: '0',
        feeData: {
          metabridge: { amount: '0' },
        },
      } as unknown as Quote;

      const result = calcSentAmount(zeroQuote, {
        exchangeRate: '2',
        usdExchangeRate: '1.5',
      });

      expect(result.amount).toBe('0');
      expect(result.valueInCurrency).toBe('0');
      expect(result.usd).toBe('0');
    });

    it('should handle large numbers', () => {
      const largeQuote = {
        srcTokenAmount: '1000000000000000000',
        srcAsset: {
          decimals: 18,
          assetId: 'eip155:1/erc20:0x0000000000000000000000000000000000000000',
        },
        feeData: {
          metabridge: {
            amount: '100000000000000000',
            asset: {
              assetId:
                'eip155:1/erc20:0x0000000000000000000000000000000000000000',
              address: '0x0000000000000000000000000000000000000000',
              decimals: 18,
            },
          },
        },
      } as unknown as Quote;

      const result = calcSentAmount(largeQuote, {
        exchangeRate: '2',
        usdExchangeRate: '1.5',
      });

      // (1 + 0.1) ETH = 1.1 ETH
      expect(result.amount).toBe('1.1');
      expect(result.valueInCurrency).toBe('2.2');
      expect(result.usd).toBe('1.65');
    });
  });

  describe('calcSolanaTotalNetworkFee', () => {
    const mockBridgeQuote: QuoteResponse & SolanaFees = {
      solanaFeesInLamports: '1000000000',
      quote: {} as Quote,
      trade: {},
    } as QuoteResponse & SolanaFees;

    it('should calculate Solana fees correctly with exchange rates', () => {
      const result = calcSolanaTotalNetworkFee(mockBridgeQuote, {
        exchangeRate: '2',
        usdExchangeRate: '1.5',
      });

      expect(result.amount).toBe('1');
      expect(result.valueInCurrency).toBe('2');
      expect(result.usd).toBe('1.5');
    });

    it('should handle missing exchange rates', () => {
      const result = calcSolanaTotalNetworkFee(mockBridgeQuote, {});

      expect(result.amount).toBe('1');
      expect(result.valueInCurrency).toBeNull();
      expect(result.usd).toBeNull();
    });

    it('should handle zero fees', () => {
      const result = calcSolanaTotalNetworkFee(
        { ...mockBridgeQuote, solanaFeesInLamports: '0' },
        { exchangeRate: '2', usdExchangeRate: '1.5' },
      );

      expect(result.amount).toBe('0');
      expect(result.valueInCurrency).toBe('0');
      expect(result.usd).toBe('0');
    });
  });

  describe('calcToAmount', () => {
    const mockQuote: Quote = {
      destTokenAmount: '1000000000',
      destAsset: { decimals: 6 },
    } as Quote;

    it('should calculate destination amount correctly with exchange rates', () => {
      const result = calcToAmount(mockQuote, {
        exchangeRate: '2',
        usdExchangeRate: '1.5',
      });

      expect(result.amount).toBe('1000');
      expect(result.valueInCurrency).toBe('2000');
      expect(result.usd).toBe('1500');
    });

    it('should handle missing exchange rates', () => {
      const result = calcToAmount(mockQuote, {});

      expect(result.amount).toBe('1000');
      expect(result.valueInCurrency).toBeNull();
      expect(result.usd).toBeNull();
    });
  });

  describe('calcRelayerFee', () => {
    const mockBridgeQuote: QuoteResponse = {
      quote: {
        srcAsset: { address: '0x123', decimals: 18 },
        srcTokenAmount: '1000000000000000000',
        feeData: { metabridge: { amount: '100000000000000000' } },
      },
      trade: { value: '0x10A741A462780000' },
    } as QuoteResponse;

    it('should calculate relayer fee correctly with exchange rates', () => {
      const result = calcRelayerFee(mockBridgeQuote, {
        exchangeRate: '2',
        usdExchangeRate: '1.5',
      });

      expect(result.amount).toStrictEqual(new BigNumber(1.2));
      expect(result.valueInCurrency).toStrictEqual(new BigNumber(2.4));
      expect(result.usd).toStrictEqual(new BigNumber(1.8));
    });

    it('should calculate relayer fee correctly with no trade.value', () => {
      const result = calcRelayerFee(
        { ...mockBridgeQuote, trade: {} as TxData },
        {
          exchangeRate: '2',
          usdExchangeRate: '1.5',
        },
      );

      expect(result.amount).toStrictEqual(new BigNumber(0));
      expect(result.valueInCurrency).toStrictEqual(new BigNumber(0));
      expect(result.usd).toStrictEqual(new BigNumber(0));
    });

    it('should handle native token address', () => {
      const nativeBridgeQuote = {
        ...mockBridgeQuote,
        quote: {
          ...mockBridgeQuote.quote,
          srcTokenAmount: '1000000000000000000',
          feeData: {
            metabridge: {
              amount: '100000000000000000',
              asset: {
                address: AddressZero,
                decimals: 18,
                assetId:
                  'eip155:1/erc20:0x0000000000000000000000000000000000000000',
              },
            },
          },
          srcAsset: {
            address: AddressZero,
            decimals: 18,
            assetId:
              'eip155:1/erc20:0x0000000000000000000000000000000000000000',
          },
        },
      } as unknown as QuoteResponse;

      const result = calcRelayerFee(nativeBridgeQuote, {
        exchangeRate: '2',
        usdExchangeRate: '1.5',
      });

      expect(
        convertHexToDecimal(nativeBridgeQuote.trade.value).toString(),
      ).toBe('1200000000000000000');
      expect(result).toStrictEqual({
        amount: new BigNumber(0.1),
        valueInCurrency: new BigNumber(0.2),
        usd: new BigNumber(0.15),
      });
    });
  });

  describe('calcEstimatedAndMaxTotalGasFee', () => {
    const mockBridgeQuote: QuoteResponse & L1GasFees = {
      quote: {} as Quote,
      trade: { gasLimit: 21000 },
      approval: { gasLimit: 46000 },
      l1GasFeesInHexWei: '0x5AF3107A4000',
    } as QuoteResponse & L1GasFees;

    it('should calculate estimated and max gas fees correctly', () => {
      const result = calcEstimatedAndMaxTotalGasFee({
        bridgeQuote: mockBridgeQuote,
        estimatedBaseFeeInDecGwei: '50',
        maxFeePerGasInDecGwei: '100',
        maxPriorityFeePerGasInDecGwei: '2',
        exchangeRate: '2000',
        usdExchangeRate: '1500',
      });

      expect(result.amount).toBeDefined();
      expect(result.amountMax).toBeDefined();
      expect(parseFloat(result.amountMax)).toBeGreaterThan(
        parseFloat(result.amount),
      );
    });

    it('should handle missing exchange rates', () => {
      const result = calcEstimatedAndMaxTotalGasFee({
        bridgeQuote: mockBridgeQuote,
        estimatedBaseFeeInDecGwei: '50',
        maxFeePerGasInDecGwei: '100',
        maxPriorityFeePerGasInDecGwei: '2',
        exchangeRate: undefined,
        usdExchangeRate: undefined,
      });

      expect(result.valueInCurrency).toBeNull();
      expect(result.valueInCurrencyMax).toBeNull();
      expect(result.usd).toBeNull();
      expect(result.usdMax).toBeNull();
      expect(result.amount).toBeDefined();
      expect(result.amountMax).toBeDefined();
    });

    it('should handle only display currency exchange rate', () => {
      const result = calcEstimatedAndMaxTotalGasFee({
        bridgeQuote: mockBridgeQuote,
        estimatedBaseFeeInDecGwei: '50',
        maxFeePerGasInDecGwei: '100',
        maxPriorityFeePerGasInDecGwei: '2',
        exchangeRate: '2000',
        usdExchangeRate: undefined,
      });

      expect(result.valueInCurrency).toBeDefined();
      expect(result.valueInCurrencyMax).toBeDefined();
      expect(result.usd).toBeNull();
      expect(result.usdMax).toBeNull();
    });

    it('should handle only USD exchange rate', () => {
      const result = calcEstimatedAndMaxTotalGasFee({
        bridgeQuote: mockBridgeQuote,
        estimatedBaseFeeInDecGwei: '50',
        maxFeePerGasInDecGwei: '100',
        maxPriorityFeePerGasInDecGwei: '2',
        exchangeRate: undefined,
        usdExchangeRate: '1500',
      });

      expect(result.valueInCurrency).toBeNull();
      expect(result.valueInCurrencyMax).toBeNull();
      expect(result.usd).toBeDefined();
      expect(result.usdMax).toBeDefined();
    });

    it('should handle zero gas limits', () => {
      const zeroGasQuote = {
        quote: {} as Quote,
        trade: { gasLimit: 0 },
        approval: { gasLimit: 0 },
        l1GasFeesInHexWei: '0x0',
        estimatedProcessingTimeInSeconds: 60,
      } as QuoteResponse & L1GasFees;

      const result = calcEstimatedAndMaxTotalGasFee({
        bridgeQuote: zeroGasQuote,
        estimatedBaseFeeInDecGwei: '50',
        maxFeePerGasInDecGwei: '100',
        maxPriorityFeePerGasInDecGwei: '2',
        exchangeRate: '2000',
        usdExchangeRate: '1500',
      });

      expect(result.amount).toBe('0');
      expect(result.amountMax).toBe('0');
      expect(result.valueInCurrency).toBe('0');
      expect(result.usd).toBe('0');
    });

    it('should handle missing approval', () => {
      const noApprovalQuote = {
        quote: {} as Quote,
        trade: { gasLimit: 21000 },
        approval: undefined,
        l1GasFeesInHexWei: '0x5AF3107A4000',
        estimatedProcessingTimeInSeconds: 60,
      } as QuoteResponse & L1GasFees;

      const result = calcEstimatedAndMaxTotalGasFee({
        bridgeQuote: noApprovalQuote,
        estimatedBaseFeeInDecGwei: '50',
        maxFeePerGasInDecGwei: '100',
        maxPriorityFeePerGasInDecGwei: '2',
        exchangeRate: '2000',
        usdExchangeRate: '1500',
      });

      expect(result.amount).toBeDefined();
      expect(result.amountMax).toBeDefined();
      expect(parseFloat(result.amountMax)).toBeGreaterThan(
        parseFloat(result.amount),
      );
    });

    it('should handle missing trade gasLimit', () => {
      const noGasLimitQuote = {
        quote: {} as Quote,
        trade: { gasLimit: undefined },
        approval: { gasLimit: 46000 },
        l1GasFeesInHexWei: '0x5AF3107A4000',
        estimatedProcessingTimeInSeconds: 60,
      } as unknown as QuoteResponse & L1GasFees;

      const result = calcEstimatedAndMaxTotalGasFee({
        bridgeQuote: noGasLimitQuote,
        estimatedBaseFeeInDecGwei: '50',
        maxFeePerGasInDecGwei: '100',
        maxPriorityFeePerGasInDecGwei: '2',
        exchangeRate: '2000',
        usdExchangeRate: '1500',
      });

      expect(result.amount).toBeDefined();
      expect(result.amountMax).toBeDefined();
    });

    it('should handle large gas limits and fees', () => {
      const largeGasQuote = {
        quote: {} as Quote,
        trade: { gasLimit: 1000000 },
        approval: { gasLimit: 500000 },
        l1GasFeesInHexWei: '0x1BC16D674EC80000', // 2 ETH in wei
        estimatedProcessingTimeInSeconds: 60,
      } as QuoteResponse & L1GasFees;

      const result = calcEstimatedAndMaxTotalGasFee({
        bridgeQuote: largeGasQuote,
        estimatedBaseFeeInDecGwei: '100',
        maxFeePerGasInDecGwei: '200',
        maxPriorityFeePerGasInDecGwei: '10',
        exchangeRate: '3000',
        usdExchangeRate: '2500',
      });

      expect(parseFloat(result.amount)).toBeGreaterThan(2); // Should be > 2 ETH due to L1 fees
      expect(parseFloat(result.amountMax)).toBeGreaterThan(
        parseFloat(result.amount),
      );
      expect(result.valueInCurrency).toBeDefined();
      expect(result.usd).toBeDefined();
      expect(parseFloat(result.valueInCurrency as string)).toBeGreaterThan(
        6000,
      );
      expect(parseFloat(result.usd as string)).toBeGreaterThan(5000);
    });
  });

  describe('formatEtaInMinutes', () => {
    it('should format seconds less than 60 as "< 1"', () => {
      expect(formatEtaInMinutes(30)).toBe('< 1');
      expect(formatEtaInMinutes(59)).toBe('< 1');
    });

    it('should correctly format minutes for values >= 60 seconds', () => {
      expect(formatEtaInMinutes(60)).toBe('1');
      expect(formatEtaInMinutes(120)).toBe('2');
      expect(formatEtaInMinutes(150)).toBe('3');
    });

    it('should handle large values', () => {
      expect(formatEtaInMinutes(3600)).toBe('60');
    });
  });

  describe('calcSwapRate', () => {
    it('should calculate correct swap rate', () => {
      expect(calcSwapRate('1', '2')).toBe('2');
      expect(calcSwapRate('2', '1')).toBe('0.5');
      expect(calcSwapRate('100', '250')).toBe('2.5');
    });

    it('should handle large numbers', () => {
      expect(calcSwapRate('1000000000000000000', '2000000000000000000')).toBe(
        '2',
      );
    });
  });

  describe('calcTotalEstimatedNetworkFee and calcTotalMaxNetworkFee', () => {
    const mockGasFee = {
      amount: '0.1',
      amountMax: '0.2',
      valueInCurrency: '200',
      valueInCurrencyMax: '400',
      usd: '150',
      usdMax: '300',
    };

    const mockRelayerFee = {
      amount: new BigNumber(0.05),
      valueInCurrency: new BigNumber(100),
      usd: new BigNumber(75),
    };

    it('should calculate total estimated network fee correctly', () => {
      const result = calcTotalEstimatedNetworkFee(mockGasFee, mockRelayerFee);

      expect(result.amount).toBe('0.15');
      expect(result.valueInCurrency).toBe('300');
      expect(result.usd).toBe('225');
    });

    it('should calculate total max network fee correctly', () => {
      const result = calcTotalMaxNetworkFee(mockGasFee, mockRelayerFee);

      expect(result.amount).toBe('0.25');
      expect(result.valueInCurrency).toBe('500');
      expect(result.usd).toBe('375');
    });

    it('should calculate total estimated network fee correctly with no relayer fee', () => {
      const result = calcTotalEstimatedNetworkFee(mockGasFee, {
        amount: new BigNumber(0),
        valueInCurrency: null,
        usd: null,
      });

      expect(result.amount).toBe('0.1');
      expect(result.valueInCurrency).toBe('200');
      expect(result.usd).toBe('150');
    });

    it('should calculate total max network fee correctly with no relayer fee', () => {
      const result = calcTotalMaxNetworkFee(mockGasFee, {
        amount: new BigNumber(0),
        valueInCurrency: null,
        usd: null,
      });

      expect(result.amount).toBe('0.2');
      expect(result.valueInCurrency).toBe('400');
      expect(result.usd).toBe('300');
    });
  });

  describe('calcAdjustedReturn', () => {
    const mockToAmount = {
      amount: '1000',
      valueInCurrency: '1000',
      usd: '750',
    };

    const mockNetworkFee = {
      amount: '48',
      valueInCurrency: '100',
      usd: '75',
    };

    const mockQuote = {
      feeData: {
        txFee: {
          asset: {
            assetId:
              'eip155:1/erc20:0x0000000000000000000000000000000000000000',
          },
        },
      },
      destAsset: {
        assetId: 'eip155:10/erc20:0x0000000000000000000000000000000000000000',
      },
    } as unknown as Quote;
    it('should calculate adjusted return correctly', () => {
      const result = calcAdjustedReturn(
        mockToAmount,
        mockNetworkFee,
        mockQuote,
      );

      expect(result.valueInCurrency).toBe('900');
      expect(result.usd).toBe('675');
    });

    it('should handle null values', () => {
      const result = calcAdjustedReturn(
        { amount: '1000', valueInCurrency: null, usd: null },
        mockNetworkFee,
        mockQuote,
      );

      expect(result.valueInCurrency).toBeNull();
      expect(result.usd).toBeNull();
    });
  });

  describe('calcCost', () => {
    const mockAdjustedReturn = {
      amount: '1000',
      valueInCurrency: '900',
      usd: '675',
    };

    const mockSentAmount = {
      amount: '100111',
      valueInCurrency: '1000',
      usd: '750',
    };

    it('should calculate cost correctly', () => {
      const result = calcCost(mockAdjustedReturn, mockSentAmount);

      expect(result.valueInCurrency).toBe('100');
      expect(result.usd).toBe('75');
    });

    it('should handle null values', () => {
      const result = calcCost(
        { valueInCurrency: null, usd: null },
        mockSentAmount,
      );

      expect(result.valueInCurrency).toBeNull();
      expect(result.usd).toBeNull();
    });
  });

  describe('calcSlippagePercentage', () => {
    it.each([
      ['100', null, '100', null, '0'],
      ['95', '95', '100', '100', '5'],
      ['98.3', '98.3', '100', '100', '1.7'],
      [null, '100', null, '100', '0'],
      [null, null, null, '100', null],
      ['105', '105', '100', '100', '5'],
    ])(
      'calcSlippagePercentage: calculate slippage absolute value for received amount %p, usd %p, sent amount %p, usd %p to expected slippage %p',
      (
        returnValueInCurrency: string | null,
        returnUsd: string | null,
        sentValueInCurrency: string | null,
        sentUsd: string | null,
        expectedSlippage: string | null,
      ) => {
        const result = calcSlippagePercentage(
          {
            valueInCurrency: returnValueInCurrency,
            usd: returnUsd,
          },
          {
            amount: '1000',
            valueInCurrency: sentValueInCurrency,
            usd: sentUsd,
          },
        );
        expect(result).toBe(expectedSlippage);
      },
    );

    it('should handle edge case with zero values', () => {
      const result = calcSlippagePercentage(
        { valueInCurrency: '0', usd: '0' },
        { amount: '100', valueInCurrency: '100', usd: '100' },
      );
      expect(result).toBe('100');
    });
  });
});
