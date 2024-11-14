import { zeroAddress } from "viem";

import { getContract } from "config/contracts";
import { getWhitelistedV1Tokens } from "config/tokens";
import { useMulticall } from "lib/multicall/useMulticall";
import { FREQUENT_MULTICALL_REFRESH_INTERVAL } from "lib/timeConstants";

import GlpManager from "abis/GlpManager.json";
import ReaderV2 from "abis/ReaderV2.json";
import VaultV2 from "abis/VaultV2.json";

function buildDashboardRequest(chainId: number) {
  const gmxAddress = getContract(chainId, "GMX");
  const glpAddress = getContract(chainId, "GLP");
  const usdgAddress = getContract(chainId, "USDG");

  const tokensForSupplyQuery = [gmxAddress, glpAddress, usdgAddress];

  const whitelistedTokensAddresses = getWhitelistedV1Tokens(chainId).map((token) => token.address);

  return {
    glp: {
      contractAddress: getContract(chainId, "GlpManager"),
      abi: GlpManager.abi,
      calls: {
        getAums: {
          methodName: "getAums",
          params: [],
        },
      },
    },
    reader: {
      contractAddress: getContract(chainId, "Reader"),
      abi: ReaderV2.abi,
      calls: {
        getTokenBalancesWithSupplies: {
          methodName: "getTokenBalancesWithSupplies",
          params: [zeroAddress, tokensForSupplyQuery],
        },
        getFees: {
          methodName: "getFees",
          params: [getContract(chainId, "Vault"), whitelistedTokensAddresses],
        },
      },
    },
    vault: {
      contractAddress: getContract(chainId, "Vault"),
      abi: VaultV2.abi,
      calls: {
        totalTokenWeights: {
          methodName: "totalTokenWeights",
          params: [],
        },
      },
    },
  };
}

function parseDashboardResponse(result) {
  const minAum = result.data.glp.getAums.returnValues[0];
  const maxAum = result.data.glp.getAums.returnValues[1];
  const aum = (minAum + maxAum) / 2n;

  return {
    glp: {
      aum,
    },
    reader: {
      tokenBalancesWithSupplies: {
        gmxSypply: result.data.reader.getTokenBalancesWithSupplies.returnValues[1] as bigint,
        glpSupply: result.data.reader.getTokenBalancesWithSupplies.returnValues[3] as bigint,
        usdgSupply: result.data.reader.getTokenBalancesWithSupplies.returnValues[5] as bigint,
      },
      fees: result.data.reader.getFees.returnValues as bigint[],
    },
    vault: {
      totalTokenWeights: result.data.vault.totalTokenWeights.returnValues[0] as bigint,
    },
  };
}

export type ChainStats = ReturnType<typeof parseDashboardResponse>;

export function useDashboardChainStatsMulticall(chainId: number) {
  const { data } = useMulticall(chainId, `useDashboardChainStatsMulticall`, {
    key: [chainId],
    refreshInterval: FREQUENT_MULTICALL_REFRESH_INTERVAL,
    request: buildDashboardRequest,
    parseResponse: parseDashboardResponse,
  });

  return data;
}
