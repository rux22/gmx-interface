import { Trans, t } from "@lingui/macro";
import CustomErrors from "abis/CustomErrors.json";
import { ToastifyDebug } from "components/ToastifyDebug/ToastifyDebug";
import {
  getContract,
  getDataStoreContract,
  getExchangeRouterContract,
  getGlvRouterContract,
  getMulticallContract,
  getZeroAddressContract,
} from "config/contracts";
import { NONCE_KEY, orderKey } from "config/dataStore";
import { convertTokenAddress } from "config/tokens";
import { SwapPricingType } from "domain/synthetics/orders";
import { TokenPrices, TokensData, convertToContractPrice, getTokenData } from "domain/synthetics/tokens";
import { BaseContract, BytesLike, ethers } from "ethers";
import { extractDataFromError, extractError, getErrorMessage } from "lib/contracts/transactionErrors";
import { helperToast } from "lib/helperToast";
import { sendOrderSimulatedMetric, sendOrderSimulationErrorMetric } from "lib/metrics/utils";
import { OrderMetricId } from "lib/metrics/types";
import { getProvider } from "lib/rpc";
import { getTenderlyConfig, simulateTxWithTenderly } from "lib/tenderly";
import { OracleUtils } from "typechain-types/ExchangeRouter";
import { withRetry } from "viem";
import { isGlvEnabled } from "../markets/glv";

export type PriceOverrides = {
  [address: string]: TokenPrices | undefined;
};

type SimulateExecuteParams = {
  account: string;
  createMulticallPayload: string[];
  primaryPriceOverrides: PriceOverrides;
  tokensData: TokensData;
  value: bigint;
  method?:
    | "simulateExecuteDeposit"
    | "simulateExecuteWithdrawal"
    | "simulateExecuteOrder"
    | "simulateExecuteShift"
    | "simulateExecuteGlvDeposit"
    | "simulateExecuteGlvWithdrawal";
  errorTitle?: string;
  swapPricingType?: SwapPricingType;
  metricId?: OrderMetricId;
};

export async function simulateExecuteTxn(chainId: number, p: SimulateExecuteParams) {
  const provider = getProvider(undefined, chainId);

  const dataStoreAddress = getContract(chainId, "DataStore");
  const multicallAddress = getContract(chainId, "Multicall");

  const dataStore = getDataStoreContract(chainId, provider);
  const multicall = getMulticallContract(chainId, provider);
  const exchangeRouter = getExchangeRouterContract(chainId, provider);
  const glvRouter = isGlvEnabled(chainId) ? getGlvRouterContract(chainId, provider) : getZeroAddressContract(provider);

  const result = await multicall.blockAndAggregate.staticCall([
    { target: dataStoreAddress, callData: dataStore.interface.encodeFunctionData("getUint", [NONCE_KEY]) },
    { target: multicallAddress, callData: multicall.interface.encodeFunctionData("getCurrentBlockTimestamp") },
  ]);

  const blockNumber = Number(result.blockNumber);

  const [nonce] = dataStore.interface.decodeFunctionResult("getUint", result.returnData[0].returnData);
  const [blockTimestamp] = multicall.interface.decodeFunctionResult(
    "getCurrentBlockTimestamp",
    result.returnData[1].returnData
  );

  const nextNonce = nonce + 1n;
  const nextKey = orderKey(dataStoreAddress, nextNonce) as BytesLike;

  const { primaryTokens, primaryPrices } = getSimulationPrices(chainId, p.tokensData, p.primaryPriceOverrides);
  const priceTimestamp = blockTimestamp + 10n;
  const method = p.method || "simulateExecuteOrder";

  const isGlv = method === "simulateExecuteGlvDeposit" || method === "simulateExecuteGlvWithdrawal";

  const simulationPriceParams = {
    primaryTokens: primaryTokens,
    primaryPrices: primaryPrices,
    minTimestamp: priceTimestamp,
    maxTimestamp: priceTimestamp,
  } as OracleUtils.SimulatePricesParamsStruct;

  let simulationPayloadData = [...p.createMulticallPayload];

  if (method === "simulateExecuteWithdrawal") {
    if (p.swapPricingType === undefined) {
      throw new Error("swapPricingType is required for simulateExecuteWithdrawal");
    }

    simulationPayloadData.push(
      exchangeRouter.interface.encodeFunctionData("simulateExecuteWithdrawal", [
        nextKey,
        simulationPriceParams,
        p.swapPricingType,
      ])
    );
  } else if (method === "simulateExecuteDeposit") {
    simulationPayloadData.push(
      exchangeRouter.interface.encodeFunctionData("simulateExecuteDeposit", [nextKey, simulationPriceParams])
    );
  } else if (method === "simulateExecuteOrder") {
    simulationPayloadData.push(
      exchangeRouter.interface.encodeFunctionData("simulateExecuteOrder", [nextKey, simulationPriceParams])
    );
  } else if (method === "simulateExecuteShift") {
    simulationPayloadData.push(
      exchangeRouter.interface.encodeFunctionData("simulateExecuteShift", [nextKey, simulationPriceParams])
    );
  } else if (method === "simulateExecuteGlvDeposit") {
    simulationPayloadData.push(
      glvRouter.interface.encodeFunctionData("simulateExecuteGlvDeposit", [nextKey, simulationPriceParams])
    );
  } else if (method === "simulateExecuteGlvWithdrawal") {
    simulationPayloadData.push(
      glvRouter.interface.encodeFunctionData("simulateExecuteGlvWithdrawal", [nextKey, simulationPriceParams])
    );
  } else {
    throw new Error(`Unknown method: ${method}`);
  }

  const errorTitle = p.errorTitle || t`Execute order simulation failed.`;

  const tenderlyConfig = getTenderlyConfig();
  const router = isGlv ? glvRouter : exchangeRouter;

  if (tenderlyConfig) {
    await simulateTxWithTenderly(chainId, router as BaseContract, p.account, "multicall", [simulationPayloadData], {
      value: p.value,
      comment: `calling ${method}`,
    });
  }

  try {
    await withRetry(
      () => {
        return router.multicall.staticCall(simulationPayloadData, {
          value: p.value,
          blockTag: blockNumber,
          from: p.account,
        });
      },
      {
        retryCount: 2,
        delay: 200,
        shouldRetry: ({ error }) => {
          const [message] = extractError(error);
          return message?.includes("unsupported block number") ?? false;
        },
      }
    );
  } catch (txnError) {
    const customErrors = new ethers.Contract(ethers.ZeroAddress, CustomErrors.abi);
    let msg: React.ReactNode = undefined;

    try {
      const errorData = extractDataFromError(txnError?.info?.error?.message) ?? extractDataFromError(txnError?.message);

      const error = new Error("No data found in error.");
      error.cause = txnError;
      if (!errorData) throw error;

      const parsedError = customErrors.interface.parseError(errorData);
      const isSimulationPassed = parsedError?.name === "EndOfOracleSimulation";

      if (isSimulationPassed) {
        if (p.metricId) {
          sendOrderSimulatedMetric(p.metricId);
        }
        return;
      }

      if (p.metricId) {
        sendOrderSimulationErrorMetric(p.metricId, txnError);
      }

      const parsedArgs = Object.keys(parsedError?.args ?? []).reduce((acc, k) => {
        if (!Number.isNaN(Number(k))) {
          return acc;
        }
        acc[k] = parsedError?.args[k].toString();
        return acc;
      }, {});

      msg = (
        <div>
          {errorTitle}
          <br />
          <br />
          <ToastifyDebug
            error={`${txnError?.info?.error?.message ?? parsedError?.name ?? txnError?.message} ${JSON.stringify(parsedArgs, null, 2)}`}
          />
        </div>
      );
    } catch (parsingError) {
      // eslint-disable-next-line no-console
      console.error(parsingError);

      const commonError = getErrorMessage(chainId, txnError, errorTitle);
      msg = commonError.failMsg;
    }

    if (!msg) {
      msg = (
        <div>
          <Trans>Execute order simulation failed.</Trans>
          <br />
          <br />
          <ToastifyDebug error={t`Unknown Error`} />
        </div>
      );
    }

    helperToast.error(msg);

    throw txnError;
  }
}

function getSimulationPrices(chainId: number, tokensData: TokensData, primaryPricesMap: PriceOverrides) {
  const tokenAddresses = Object.keys(tokensData);

  const primaryTokens: string[] = [];
  const primaryPrices: { min: bigint; max: bigint }[] = [];

  for (const address of tokenAddresses) {
    const token = getTokenData(tokensData, address);
    const convertedAddress = convertTokenAddress(chainId, address, "wrapped");

    if (!token?.prices || primaryTokens.includes(convertedAddress)) {
      continue;
    }

    primaryTokens.push(convertedAddress);

    const currentPrice = {
      min: convertToContractPrice(token.prices.minPrice, token.decimals),
      max: convertToContractPrice(token.prices.maxPrice, token.decimals),
    };

    const primaryOverriddenPrice = primaryPricesMap[address];

    if (primaryOverriddenPrice) {
      primaryPrices.push({
        min: convertToContractPrice(primaryOverriddenPrice.minPrice, token.decimals),
        max: convertToContractPrice(primaryOverriddenPrice.maxPrice, token.decimals),
      });
    } else {
      primaryPrices.push(currentPrice);
    }
  }

  return {
    primaryTokens,
    primaryPrices,
  };
}
