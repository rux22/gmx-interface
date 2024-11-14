import { useMemo } from "react";

import { getTokensMap, getV2Tokens } from "config/tokens";
import { TokensData } from "./types";
import { useTokenBalances } from "./useTokenBalances";
import { useTokenRecentPricesRequest } from "./useTokenRecentPricesData";

type TokensDataResult = {
  tokensData?: TokensData;
  pricesUpdatedAt?: number;
  isBalancesLoaded?: boolean;
  error?: Error;
};

export function useTokensDataRequest(chainId: number): TokensDataResult {
  const tokenConfigs = getTokensMap(chainId);
  const { balancesData, error: balancesError } = useTokenBalances(chainId);
  const { pricesData, updatedAt: pricesUpdatedAt, error: pricesError } = useTokenRecentPricesRequest(chainId);

  const error = balancesError || pricesError;

  return useMemo(() => {
    if (error) {
      return {
        error,
      };
    }

    const tokenAddresses = getV2Tokens(chainId).map((token) => token.address);

    if (!pricesData) {
      return {
        tokensData: undefined,
        pricesUpdatedAt: undefined,
      };
    }

    const isBalancesLoaded = Boolean(balancesData);

    return {
      tokensData: tokenAddresses.reduce((acc: TokensData, tokenAddress) => {
        const prices = pricesData[tokenAddress];
        const balance = balancesData?.[tokenAddress];
        const tokenConfig = tokenConfigs[tokenAddress];

        if (!prices) {
          return acc;
        }

        acc[tokenAddress] = {
          ...tokenConfig,
          prices,
          balance,
        };
        return acc;
      }, {} as TokensData),
      pricesUpdatedAt,
      isBalancesLoaded,
    };
  }, [error, chainId, pricesData, pricesUpdatedAt, balancesData, tokenConfigs]);
}
