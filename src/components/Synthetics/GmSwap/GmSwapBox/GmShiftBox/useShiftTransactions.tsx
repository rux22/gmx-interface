import { useCallback, useState } from "react";

import { DEFAULT_SLIPPAGE_AMOUNT } from "config/factors";
import { useSyntheticsEvents } from "context/SyntheticsEvents";
import { ExecutionFee } from "domain/synthetics/fees";
import { createShiftTxn } from "domain/synthetics/markets/createShiftTxn";
import { usePendingTxns } from "lib/usePendingTxns";
import useWallet from "lib/wallets/useWallet";
import { selectChainId } from "context/SyntheticsStateContext/selectors/globalSelectors";
import { useSelector } from "context/SyntheticsStateContext/utils";
import type { TokenData, TokensData } from "domain/synthetics/tokens/types";

interface Props {
  fromMarketToken: TokenData | undefined;
  fromMarketTokenAmount: bigint | undefined;
  fromMarketTokenUsd: bigint | undefined;
  marketToken: TokenData | undefined;
  marketTokenAmount: bigint | undefined;
  marketTokenUsd: bigint | undefined;
  executionFee: ExecutionFee | undefined;
  shouldDisableValidation: boolean;
  tokensData: TokensData | undefined;
}

export function useShiftTransactions({
  fromMarketToken,
  fromMarketTokenAmount,
  marketToken,
  marketTokenAmount,
  executionFee,
  shouldDisableValidation,
  tokensData,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const chainId = useSelector(selectChainId);
  const { signer, account } = useWallet();
  const { setPendingShift } = useSyntheticsEvents();
  const [, setPendingTxns] = usePendingTxns();

  const onCreateShift = useCallback(
    function onCreateShift() {
      if (
        !signer ||
        !account ||
        !fromMarketToken ||
        !executionFee ||
        !marketToken ||
        fromMarketTokenAmount === undefined ||
        marketTokenAmount === undefined ||
        !tokensData
      ) {
        return Promise.resolve();
      }

      return createShiftTxn(chainId, signer, {
        account,
        fromMarketTokenAddress: fromMarketToken.address,
        fromMarketTokenAmount: fromMarketTokenAmount,
        toMarketTokenAddress: marketToken.address,
        minToMarketTokenAmount: marketTokenAmount,
        executionFee: executionFee.feeTokenAmount,
        allowedSlippage: DEFAULT_SLIPPAGE_AMOUNT,
        skipSimulation: shouldDisableValidation,
        tokensData,
        setPendingTxns,
        setPendingShift,
      });
    },
    [
      account,
      executionFee,
      fromMarketToken,
      fromMarketTokenAmount,
      marketToken,
      marketTokenAmount,
      signer,
      tokensData,
      shouldDisableValidation,
      chainId,
      setPendingShift,
      setPendingTxns,
    ]
  );

  const onSubmit = useCallback(() => {
    setIsSubmitting(true);

    onCreateShift()
      .catch((error) => {
        throw error;
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }, [onCreateShift]);

  return {
    onSubmit,
    isSubmitting,
  };
}
