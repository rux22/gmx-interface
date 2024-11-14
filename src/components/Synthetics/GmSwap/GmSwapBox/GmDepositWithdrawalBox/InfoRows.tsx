import { t } from "@lingui/macro";
import values from "lodash/values";
import { useCallback } from "react";

import { ExchangeInfo } from "components/Exchange/ExchangeInfo";
import ExchangeInfoRow from "components/Exchange/ExchangeInfoRow";
import { GmPoolsSelectorForGlvMarket } from "components/MarketSelector/GmPoolsSelectorForGlvMarket";
import { PoolSelector } from "components/MarketSelector/PoolSelector";
import { GmFees } from "components/Synthetics/GmSwap/GmFees/GmFees";
import { NetworkFeeRow } from "components/Synthetics/NetworkFeeRow/NetworkFeeRow";

import { selectGlvAndMarketsInfoData } from "context/SyntheticsStateContext/selectors/globalSelectors";

import { useSelector } from "context/SyntheticsStateContext/utils";
import { ExecutionFee } from "domain/synthetics/fees";
import { getGlvOrMarketAddress, GlvInfo, GlvOrMarketInfo, MarketInfo } from "domain/synthetics/markets";
import { TokensData } from "domain/synthetics/tokens";
import { GmSwapFees } from "domain/synthetics/trade";

import { HighPriceImpactRow } from "../HighPriceImpactRow";
import { showMarketToast } from "../showMarketToast";

export function InfoRows({
  indexName,
  marketAddress,
  marketTokensData,
  isDeposit,
  fees,
  executionFee,
  glvInfo,
  isHighPriceImpact,
  isHighPriceImpactAccepted,
  setIsHighPriceImpactAccepted,
  isSingle,
  onMarketChange,
  selectedMarketForGlv,
  disablePoolSelector,
}: {
  indexName: string | undefined;
  marketAddress: string | undefined;
  marketTokensData: TokensData | undefined;
  isDeposit: boolean;
  fees: GmSwapFees | undefined;
  executionFee: ExecutionFee | undefined;
  glvInfo: GlvInfo | undefined;
  isHighPriceImpact: boolean;
  isHighPriceImpactAccepted: boolean;
  setIsHighPriceImpactAccepted: (val: boolean) => void;
  isSingle: boolean;
  onMarketChange: (marketAddress: string) => void;
  selectedMarketForGlv?: string;
  disablePoolSelector?: boolean;
}) {
  const markets = values(useSelector(selectGlvAndMarketsInfoData));

  const onSelectMarket = useCallback(
    (marketInfo: MarketInfo) => {
      onMarketChange?.(marketInfo.marketTokenAddress);
    },
    [onMarketChange]
  );

  const onSelectMarketOrGlv = useCallback(
    (glvOrMarketInfo: GlvOrMarketInfo) => {
      onMarketChange(getGlvOrMarketAddress(glvOrMarketInfo));
      showMarketToast(glvOrMarketInfo);
    },
    [onMarketChange]
  );

  return (
    <ExchangeInfo className="GmSwapBox-info-section" dividerClassName="App-card-divider">
      <ExchangeInfo.Group>
        <ExchangeInfoRow
          className="SwapBox-info-row"
          label={t`Pool`}
          value={
            glvInfo ? (
              <GmPoolsSelectorForGlvMarket
                label={t`Pool`}
                className="-mr-4"
                isDeposit={isDeposit}
                selectedIndexName={indexName}
                selectedMarketAddress={selectedMarketForGlv}
                markets={markets}
                glvInfo={glvInfo}
                marketTokensData={marketTokensData}
                isSideMenu
                showAllPools
                showBalances
                disablePoolSelector={disablePoolSelector}
                onSelectMarket={onSelectMarket}
                favoriteKey="gm-pool-selector"
              />
            ) : (
              <PoolSelector
                label={t`Pool`}
                className="-mr-4"
                selectedIndexName={indexName}
                selectedMarketAddress={marketAddress}
                markets={markets}
                marketTokensData={marketTokensData}
                isSideMenu
                showBalances
                onSelectMarket={onSelectMarketOrGlv}
                favoriteKey="gm-pool-selector"
              />
            )
          }
        />
      </ExchangeInfo.Group>

      <ExchangeInfo.Group>
        <div className="GmSwapBox-info-section">
          <GmFees
            isDeposit={isDeposit}
            totalFees={fees?.totalFees}
            swapFee={fees?.swapFee}
            swapPriceImpact={fees?.swapPriceImpact}
            uiFee={fees?.uiFee}
          />
          <NetworkFeeRow executionFee={executionFee} />
        </div>
      </ExchangeInfo.Group>

      {isHighPriceImpact && (
        <HighPriceImpactRow
          isHighPriceImpactAccepted={isHighPriceImpactAccepted}
          setIsHighPriceImpactAccepted={setIsHighPriceImpactAccepted}
          isSingle={isSingle}
        />
      )}
    </ExchangeInfo>
  );
}
