import { Trans } from "@lingui/macro";
import { useMemo } from "react";

import { formatTokenAmount, formatTokenAmountWithUsd, formatUsd } from "lib/numbers";

import StatsTooltipRow from "components/StatsTooltip/StatsTooltipRow";
import TooltipWithPortal from "components/Tooltip/TooltipWithPortal";

import { getMaxPoolUsd, getPoolUsdWithoutPnl, GlvOrMarketInfo } from "domain/synthetics/markets";
import { TokenData } from "domain/synthetics/tokens";

import { isGlvInfo } from "domain/synthetics/markets/glv";
import { TokenValuesInfoCell } from "./TokenValuesInfoCell";

export function MintableAmount({
  mintableInfo,
  market,
  token,
  longToken,
  shortToken,
}: {
  mintableInfo:
    | {
        mintableAmount: bigint;
        mintableUsd: bigint;
        longDepositCapacityUsd?: bigint;
        shortDepositCapacityUsd?: bigint;
        longDepositCapacityAmount?: bigint;
        shortDepositCapacityAmount?: bigint;
      }
    | undefined;
  market: GlvOrMarketInfo;
  token: TokenData;
  longToken?: TokenData;
  shortToken?: TokenData;
}) {
  const isGlv = isGlvInfo(market);

  const longTokenMaxValue = useMemo(
    () =>
      isGlv
        ? []
        : [
            mintableInfo && longToken
              ? formatTokenAmountWithUsd(
                  mintableInfo.longDepositCapacityAmount,
                  mintableInfo.longDepositCapacityUsd,
                  longToken.symbol,
                  longToken.decimals
                )
              : "-",
            `(${formatUsd(getPoolUsdWithoutPnl(market, true, "midPrice"))} / ${formatUsd(getMaxPoolUsd(market, true))})`,
          ],
    [isGlv, longToken, market, mintableInfo]
  );
  const shortTokenMaxValue = useMemo(
    () =>
      isGlv
        ? []
        : [
            mintableInfo && shortToken
              ? formatTokenAmountWithUsd(
                  mintableInfo.shortDepositCapacityAmount,
                  mintableInfo.shortDepositCapacityUsd,
                  shortToken.symbol,
                  shortToken.decimals
                )
              : "-",
            `(${formatUsd(getPoolUsdWithoutPnl(market, false, "midPrice"))} / ${formatUsd(getMaxPoolUsd(market, false))})`,
          ],
    [isGlv, market, mintableInfo, shortToken]
  );

  const content = (
    <TokenValuesInfoCell
      usd={formatUsd(mintableInfo?.mintableUsd, {
        displayDecimals: 0,
      })}
      token={formatTokenAmount(mintableInfo?.mintableAmount, token.decimals, token.symbol, {
        useCommas: true,
        displayDecimals: 0,
      })}
    />
  );

  if (!longToken || !shortToken) {
    return content;
  }

  return (
    <TooltipWithPortal
      maxAllowedWidth={350}
      handle={content}
      className="normal-case"
      position="bottom-end"
      handleClassName="!block"
      renderContent={() => (
        <>
          <p className="text-white">
            {market?.isSameCollaterals ? (
              <Trans>{longToken.symbol} can be used to buy GM for this market up to the specified buying caps.</Trans>
            ) : (
              <Trans>
                {longToken.symbol} and {shortToken.symbol} can be used to buy GM for this market up to the specified
                buying caps.
              </Trans>
            )}
          </p>
          <br />
          <StatsTooltipRow label={`Max ${longToken.symbol}`} value={longTokenMaxValue} />
          <StatsTooltipRow label={`Max ${shortToken.symbol}`} value={shortTokenMaxValue} />
        </>
      )}
    />
  );
}
