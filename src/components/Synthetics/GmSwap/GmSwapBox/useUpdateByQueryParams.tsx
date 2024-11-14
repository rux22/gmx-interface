import { Trans } from "@lingui/macro";
import { isAddress } from "ethers";
import values from "lodash/values";
import { useEffect, useMemo } from "react";
import { useHistory } from "react-router-dom";

import { convertTokenAddress, getTokenBySymbolSafe } from "config/tokens";

import { selectChainId, selectGlvAndMarketsInfoData } from "context/SyntheticsStateContext/selectors/globalSelectors";
import { selectShiftAvailableMarkets } from "context/SyntheticsStateContext/selectors/shiftSelectors";
import { useSelector } from "context/SyntheticsStateContext/utils";

import {
  getGlvDisplayName,
  getMarketIndexName,
  getGlvOrMarketAddress,
  getMarketPoolName,
} from "domain/synthetics/markets/utils";

import { helperToast } from "lib/helperToast";
import { getMatchingValueFromObject } from "lib/objects";
import useSearchParams from "lib/useSearchParams";

import { isGlvInfo } from "../../../../domain/synthetics/markets/glv";
import { Mode, Operation } from "./types";

type SearchParams = {
  market?: string;
  operation?: string;
  mode?: string;
  from?: string;
  pool?: string;
  scroll?: string;
  pickBestGlv?: string;
};

export function useUpdateByQueryParams({
  operation: currentOperation,
  setOperation,
  setMode,
  setFirstTokenAddress,
  onSelectMarket,
  selectedMarketForGlv,
  onSelectedMarketForGlv,
  setIsMarketForGlvSelectedManually,
}: {
  operation: Operation;
  setOperation: (operation: Operation) => void;
  setMode: (mode: Mode) => void;
  setFirstTokenAddress?: (address: string | undefined) => void;
  onSelectMarket: (marketAddress: string) => void;
  onSelectedMarketForGlv?: (marketAddress?: string) => void;
  selectedMarketForGlv?: string;
  setIsMarketForGlvSelectedManually?: (isMarketForGlvSelectedManually: boolean) => void;
}) {
  const history = useHistory();
  const searchParams = useSearchParams<SearchParams>();
  const shiftAvailableMarkets = useSelector(selectShiftAvailableMarkets);

  const chainId = useSelector(selectChainId);
  const marketsOrGlvInfo = useSelector(selectGlvAndMarketsInfoData);
  const marketsOrGlvs = useMemo(() => values(marketsOrGlvInfo), [marketsOrGlvInfo]);

  useEffect(
    function updateByQueryParams() {
      const { market: marketRaw, operation, mode, from: fromToken, pool, scroll, pickBestGlv } = searchParams;
      let marketAddress = marketRaw?.toLowerCase();

      if (operation) {
        let finalOperation;

        if (operation.toLowerCase() === "buy") {
          finalOperation = Operation.Deposit;
        } else if (operation.toLowerCase() === "sell") {
          finalOperation = Operation.Withdrawal;
        } else if (operation.toLowerCase() === "shift") {
          finalOperation = Operation.Shift;
        }

        if (finalOperation) {
          setOperation(finalOperation as Operation);
        }
      }

      if (pickBestGlv) {
        setOperation(Operation.Deposit);

        const glvs = Object.values(marketsOrGlvInfo).filter(isGlvInfo);

        if (glvs.length) {
          const bestGlv = glvs.reduce((best, glv) => {
            return (best.glvToken.totalSupply ?? 0n) > (glv.glvToken.totalSupply ?? 0n) ? best : glv;
          });
          marketAddress = bestGlv.glvTokenAddress.toLowerCase();
        }
      }

      if (mode) {
        const validMode = getMatchingValueFromObject(Mode, mode);
        if (validMode) {
          setMode(validMode as Mode);
        }
      }

      if (fromToken && setFirstTokenAddress) {
        const fromTokenInfo = getTokenBySymbolSafe(chainId, fromToken, {
          version: "v2",
        });
        if (fromTokenInfo) {
          setFirstTokenAddress(convertTokenAddress(chainId, fromTokenInfo.address, "wrapped"));
        }
      }

      if (scroll === "1") {
        window.scrollTo({ top: 0, left: 0 });
      }

      if ((marketAddress || pool) && marketsOrGlvs.length > 0) {
        if (marketAddress && isAddress(marketAddress)) {
          const marketInfo = marketsOrGlvs.find(
            (market) => getGlvOrMarketAddress(market).toLowerCase() === marketAddress
          );
          if (marketInfo) {
            onSelectMarket(getGlvOrMarketAddress(marketInfo));
            setIsMarketForGlvSelectedManually?.(false);
            const isGlv = isGlvInfo(marketInfo);
            const indexName = isGlv ? undefined : getMarketIndexName(marketInfo);
            const poolName = getMarketPoolName(marketInfo);
            const titlePrefix = isGlv ? getGlvDisplayName(marketInfo) : "GM: ";
            helperToast.success(
              <Trans>
                <div className="inline-flex">
                  {titlePrefix}
                  {indexName ? <span>&nbsp;{indexName}</span> : null}
                  <span className="ml-2 text-12 font-normal text-gray-300">[{poolName}]</span>
                </div>{" "}
                <span>selected in order form</span>
              </Trans>
            );

            const isCurrentlyShift = currentOperation === Operation.Shift;
            const isNewMarketShiftAvailable = shiftAvailableMarkets.find(
              (shiftMarket) => getGlvOrMarketAddress(shiftMarket) === getGlvOrMarketAddress(marketInfo)
            );

            if (isCurrentlyShift && !isNewMarketShiftAvailable) {
              setOperation(Operation.Deposit);
            }

            if (pool && isGlv && setFirstTokenAddress) {
              setFirstTokenAddress(pool);
              onSelectedMarketForGlv?.(pool);
            }

            if (!pool && isGlv && selectedMarketForGlv) {
              onSelectedMarketForGlv?.(undefined);
            }
          }
        }

        if (history.location.search) {
          history.replace({ search: "" });
        }
      }

      if (!marketAddress && !pool && !pickBestGlv) {
        if (history.location.search) {
          history.replace({ search: "" });
        }
      }
    },
    [
      history,
      onSelectMarket,
      searchParams,
      setOperation,
      setMode,
      setFirstTokenAddress,
      setIsMarketForGlvSelectedManually,
      chainId,
      marketsOrGlvs,
      marketsOrGlvInfo,
      currentOperation,
      shiftAvailableMarkets,
      onSelectedMarketForGlv,
      selectedMarketForGlv,
    ]
  );
}
