import { plural, t } from "@lingui/macro";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import uniq from "lodash/uniq";
import { useMemo } from "react";

import { ExecutionFee } from "domain/synthetics/fees";
import { getNeedTokenApprove, getTokenData, useTokensAllowanceData } from "domain/synthetics/tokens";
import { useHasOutdatedUi } from "domain/legacy";
import type { MarketInfo } from "domain/synthetics/markets/types";
import type { TokenData, TokensData } from "domain/synthetics/tokens/types";
import type { GmSwapFees } from "domain/synthetics/trade/types";
import type { ShiftAmounts } from "domain/synthetics/trade/utils/shift";
import { getCommonError, getGmShiftError } from "domain/synthetics/trade/utils/validation";

import { selectAccount, selectChainId } from "context/SyntheticsStateContext/selectors/globalSelectors";
import { useSelector } from "context/SyntheticsStateContext/utils";

import { useShiftTransactions } from "./useShiftTransactions";

export function useShiftSubmitState({
  amounts,
  executionFee,
  fees,
  isHighFeeConsentError,
  isHighPriceImpact,
  isHighPriceImpactAccepted,
  marketTokenUsd,
  payTokenAddresses,
  routerAddress,
  selectedMarketInfo,
  selectedToken,
  shouldDisableValidationForTesting,
  tokensData,
  toMarketInfo,
  toToken,
}: {
  amounts: ShiftAmounts | undefined;
  executionFee: ExecutionFee | undefined;
  fees: GmSwapFees | undefined;
  isHighFeeConsentError: boolean | undefined;
  isHighPriceImpact: boolean;
  isHighPriceImpactAccepted: boolean;
  marketTokenUsd: bigint | undefined;
  payTokenAddresses: string[];
  routerAddress: string;
  selectedMarketInfo: MarketInfo | undefined;
  selectedToken: TokenData | undefined;
  shouldDisableValidationForTesting: boolean;
  tokensData: TokensData | undefined;
  toMarketInfo: MarketInfo | undefined;
  toToken: TokenData | undefined;
}) {
  const chainId = useSelector(selectChainId);
  const account = useSelector(selectAccount);
  const { data: hasOutdatedUi } = useHasOutdatedUi();

  const { openConnectModal } = useConnectModal();

  const { isSubmitting, onSubmit } = useShiftTransactions({
    fromMarketToken: selectedToken,
    fromMarketTokenAmount: amounts?.fromTokenAmount,
    fromMarketTokenUsd: amounts?.fromTokenUsd,
    marketToken: toToken,
    marketTokenAmount: amounts?.toTokenAmount,
    shouldDisableValidation: shouldDisableValidationForTesting,
    tokensData,
    executionFee,
    marketTokenUsd,
  });

  const { tokensAllowanceData } = useTokensAllowanceData(chainId, {
    spenderAddress: routerAddress,
    tokenAddresses: payTokenAddresses,
  });

  const tokensToApprove = useMemo(
    function getTokensToApprove() {
      const addresses: string[] = [];

      if (
        amounts?.fromTokenAmount !== undefined &&
        amounts?.fromTokenAmount > 0 &&
        selectedToken &&
        getNeedTokenApprove(tokensAllowanceData, selectedToken.address, amounts?.fromTokenAmount)
      ) {
        addresses.push(selectedToken.address);
      }

      return uniq(addresses);
    },
    [selectedToken, amounts?.fromTokenAmount, tokensAllowanceData]
  );

  return useMemo(() => {
    if (isSubmitting) {
      return {
        text: t`Submitting...`,
        disabled: true,
        tokensToApprove,
      };
    }

    if (!account) {
      return {
        text: t`Connect Wallet`,
        onSubmit: () => openConnectModal?.(),
        tokensToApprove,
      };
    }

    if (isHighFeeConsentError) {
      return {
        text: t`High Network Fee not yet acknowledged`,
        disabled: true,
        tokensToApprove,
      };
    }

    if (tokensToApprove.length > 0 && selectedToken) {
      const symbols = tokensToApprove.map((address) => {
        const token = getTokenData(tokensData, address);
        return token?.symbol;
      });

      const symbolsText = symbols.join(", ");

      return {
        text: plural(symbols.length, {
          one: `Pending ${symbolsText} approval`,
          other: `Pending ${symbolsText} approvals`,
        }),
        disabled: true,
        tokensToApprove,
      };
    }

    const commonError = getCommonError({
      chainId,
      isConnected: true,
      hasOutdatedUi,
    })[0];

    const shiftError = getGmShiftError({
      fromMarketInfo: selectedMarketInfo,
      fromToken: selectedToken,
      fromTokenAmount: amounts?.fromTokenAmount,
      fromTokenUsd: amounts?.fromTokenUsd,
      fromLongTokenAmount: amounts?.fromLongTokenAmount,
      fromShortTokenAmount: amounts?.fromShortTokenAmount,
      toMarketInfo: toMarketInfo,
      toToken: toToken,
      toTokenAmount: amounts?.toTokenAmount,
      fees,
      isHighPriceImpact: isHighPriceImpact,
      isHighPriceImpactAccepted,
      priceImpactUsd: amounts?.swapPriceImpactDeltaUsd,
    })[0];

    const error = commonError || shiftError;

    if (error) {
      return {
        text: error,
        error,
        disabled: !shouldDisableValidationForTesting,
        tokensToApprove,
        onSubmit,
      };
    }

    return {
      text: t`Shift GM`,
      onSubmit,
      tokensToApprove,
    };
  }, [
    account,
    chainId,
    hasOutdatedUi,
    selectedMarketInfo,
    selectedToken,
    amounts?.fromTokenAmount,
    amounts?.fromTokenUsd,
    amounts?.fromLongTokenAmount,
    amounts?.fromShortTokenAmount,
    amounts?.toTokenAmount,
    amounts?.swapPriceImpactDeltaUsd,
    toMarketInfo,
    toToken,
    fees,
    isHighPriceImpact,
    isHighPriceImpactAccepted,
    openConnectModal,
    shouldDisableValidationForTesting,
    onSubmit,
    isSubmitting,
    tokensToApprove,
    tokensData,
    isHighFeeConsentError,
  ]);
}
