import { getContract } from "config/contracts";
import {
  ESTIMATED_GAS_FEE_BASE_AMOUNT_V2_1,
  ESTIMATED_GAS_FEE_MULTIPLIER_FACTOR,
  ESTIMATED_GAS_FEE_PER_ORACLE_PRICE,
  GLV_DEPOSIT_GAS_LIMIT,
  GLV_PER_MARKET_GAS_LIMIT,
  GLV_WITHDRAWAL_GAS_LIMIT,
  decreaseOrderGasLimitKey,
  depositGasLimitKey,
  increaseOrderGasLimitKey,
  shiftGasLimitKey,
  singleSwapGasLimitKey,
  swapOrderGasLimitKey,
  withdrawalGasLimitKey,
} from "config/dataStore";
import { useMulticall } from "lib/multicall";
import { CONFIG_UPDATE_INTERVAL } from "lib/timeConstants";

import type { GasLimitsConfig } from "./types";

import DataStore from "abis/DataStore.json";

export function useGasLimits(chainId: number): GasLimitsConfig | undefined {
  const { data } = useMulticall(chainId, "useGasLimitsConfig", {
    key: [],

    refreshInterval: CONFIG_UPDATE_INTERVAL,

    request: () => ({
      dataStore: {
        contractAddress: getContract(chainId, "DataStore"),
        abi: DataStore.abi,
        calls: {
          depositSingleToken: {
            methodName: "getUint",
            params: [depositGasLimitKey(true)],
          },
          depositMultiToken: {
            methodName: "getUint",
            params: [depositGasLimitKey(false)],
          },
          withdrawalMultiToken: {
            methodName: "getUint",
            params: [withdrawalGasLimitKey()],
          },
          shift: {
            methodName: "getUint",
            params: [shiftGasLimitKey()],
          },
          singleSwap: {
            methodName: "getUint",
            params: [singleSwapGasLimitKey()],
          },
          swapOrder: {
            methodName: "getUint",
            params: [swapOrderGasLimitKey()],
          },
          increaseOrder: {
            methodName: "getUint",
            params: [increaseOrderGasLimitKey()],
          },
          decreaseOrder: {
            methodName: "getUint",
            params: [decreaseOrderGasLimitKey()],
          },
          estimatedGasFeeBaseAmount: {
            methodName: "getUint",
            params: [ESTIMATED_GAS_FEE_BASE_AMOUNT_V2_1],
          },
          estimatedGasFeePerOraclePrice: {
            methodName: "getUint",
            params: [ESTIMATED_GAS_FEE_PER_ORACLE_PRICE],
          },
          estimatedFeeMultiplierFactor: {
            methodName: "getUint",
            params: [ESTIMATED_GAS_FEE_MULTIPLIER_FACTOR],
          },
          glvDepositGasLimit: {
            methodName: "getUint",
            params: [GLV_DEPOSIT_GAS_LIMIT],
          },
          glvWithdrawalGasLimit: {
            methodName: "getUint",
            params: [GLV_WITHDRAWAL_GAS_LIMIT],
          },
          glvPerMarketGasLimit: {
            methodName: "getUint",
            params: [GLV_PER_MARKET_GAS_LIMIT],
          },
        },
      },
    }),
    parseResponse: (res) => {
      const results = res.data.dataStore;

      function getBigInt(key: keyof typeof results) {
        return BigInt(results[key].returnValues[0]);
      }

      return {
        depositSingleToken: getBigInt("depositSingleToken"),
        depositMultiToken: getBigInt("depositMultiToken"),
        withdrawalMultiToken: getBigInt("withdrawalMultiToken"),
        shift: getBigInt("shift"),
        singleSwap: getBigInt("singleSwap"),
        swapOrder: getBigInt("swapOrder"),
        increaseOrder: getBigInt("increaseOrder"),
        decreaseOrder: getBigInt("decreaseOrder"),
        estimatedGasFeeBaseAmount: getBigInt("estimatedGasFeeBaseAmount"),
        estimatedGasFeePerOraclePrice: getBigInt("estimatedGasFeePerOraclePrice"),
        estimatedFeeMultiplierFactor: getBigInt("estimatedFeeMultiplierFactor"),
        glvDepositGasLimit: getBigInt("glvDepositGasLimit"),
        glvWithdrawalGasLimit: getBigInt("glvWithdrawalGasLimit"),
        glvPerMarketGasLimit: getBigInt("glvPerMarketGasLimit"),
      };
    },
  });

  return data;
}
