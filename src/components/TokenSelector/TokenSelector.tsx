import { Trans } from "@lingui/macro";
import cx from "classnames";
import { ReactNode, useEffect, useMemo, useState } from "react";

import { BiChevronDown } from "react-icons/bi";

import { getMarketUiConfig } from "config/markets";
import { getToken } from "config/tokens";
import { getMarketBadge, MarketsInfoData } from "domain/synthetics/markets";
import { convertToUsd } from "domain/synthetics/tokens";
import { MissedCoinsPlace } from "domain/synthetics/userFeedback";
import type { InfoTokens, Token, TokenInfo } from "domain/tokens";
import { stripBlacklistedWords } from "domain/tokens/utils";
import dropDownIcon from "img/DROP_DOWN.svg";
import { bigMath } from "lib/bigmath";
import { expandDecimals, formatAmount } from "lib/numbers";
import { useFuse } from "lib/useFuse";

import SearchInput from "components/SearchInput/SearchInput";
import TokenIcon from "components/TokenIcon/TokenIcon";
import Modal from "../Modal/Modal";
import TooltipWithPortal from "../Tooltip/TooltipWithPortal";
import { WithMissedCoinsSearch } from "../WithMissedCoinsSearch/WithMissedCoinsSearch";

import "./TokenSelector.scss";

type TokenState = {
  disabled?: boolean;
  message?: string;
};

type ExtendedToken = Token & { isMarketToken?: boolean };

type Props = {
  chainId: number;
  label?: string;
  className?: string;
  tokenAddress: string;
  tokens: ExtendedToken[];
  infoTokens?: InfoTokens;
  tokenInfo?: TokenInfo;
  showMintingCap?: boolean;
  mintingCap?: bigint;
  disabled?: boolean;
  selectedTokenLabel?: ReactNode | string;
  showBalances?: boolean;
  showTokenImgInDropdown?: boolean;
  showSymbolImage?: boolean;
  showNewCaret?: boolean;
  getTokenState?: (info: TokenInfo) => TokenState | undefined;
  onSelectToken: (token: Token) => void;
  extendedSortSequence?: string[] | undefined;
  missedCoinsPlace?: MissedCoinsPlace;
  showTokenName?: boolean;
  footerContent?: ReactNode;
  marketsInfoData?: MarketsInfoData;
  qa?: string;
};

export default function TokenSelector(props: Props) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  let tokenInfo: TokenInfo | undefined = props.tokenInfo;

  if (!tokenInfo) {
    try {
      tokenInfo = getToken(props.chainId, props.tokenAddress);
    } catch (e) {
      // ...ignore unsupported tokens
    }
  }

  const {
    tokens,
    mintingCap,
    infoTokens,
    showMintingCap,
    disabled,
    selectedTokenLabel,
    showBalances = true,
    showTokenImgInDropdown = false,
    showSymbolImage = false,
    showNewCaret = false,
    getTokenState = () => ({ disabled: false, message: null }),
    extendedSortSequence,
    showTokenName,
    footerContent,
    missedCoinsPlace,
    marketsInfoData,
    chainId,
    qa,
  } = props;

  const visibleTokens = tokens.filter((t) => t && !t.isTempHidden);

  const onSelectToken = (token) => {
    setIsModalVisible(false);
    props.onSelectToken(token);
  };

  useEffect(() => {
    if (isModalVisible) {
      setSearchKeyword("");
    }
  }, [isModalVisible]);

  const fuse = useFuse(
    () =>
      visibleTokens.map((token, index) => {
        let name = token.name;
        if (token.isMarketToken) {
          const indexTokenAddress = getMarketUiConfig(props.chainId, token.address)?.indexTokenAddress;
          const indexToken = getToken(props.chainId, indexTokenAddress);
          name = indexToken.name ? `GM ${indexToken.name}` : name;
        }
        name = stripBlacklistedWords(name);

        return { id: index, name, symbol: token.symbol };
      }),
    visibleTokens.map((item) => item.address)
  );

  const filteredTokens = useMemo(() => {
    if (!searchKeyword.trim()) {
      return visibleTokens;
    }

    return fuse.search(searchKeyword).map((result) => visibleTokens[result.item.id]);
  }, [fuse, searchKeyword, visibleTokens]);

  const sortedFilteredTokens = useMemo(() => {
    const tokensWithBalance: ExtendedToken[] = [];
    const tokensWithoutBalance: ExtendedToken[] = showBalances ? [] : filteredTokens;

    for (const token of filteredTokens) {
      const info = infoTokens?.[token.address];
      if (showBalances) {
        if (info?.balance && info?.balance > 0) {
          tokensWithBalance.push(token);
        } else {
          tokensWithoutBalance.push(token);
        }
      }
    }

    const sortedTokensWithBalance = tokensWithBalance.sort((a, b) => {
      const aInfo = infoTokens?.[a.address];
      const bInfo = infoTokens?.[b.address];

      if (!aInfo || !bInfo) return 0;

      if (aInfo?.balance && bInfo?.balance && aInfo?.maxPrice && bInfo?.maxPrice) {
        const aBalanceUsd = convertToUsd(aInfo.balance, a.decimals, aInfo.minPrice);
        const bBalanceUsd = convertToUsd(bInfo.balance, b.decimals, bInfo.minPrice);

        if (bBalanceUsd === undefined) return -1;

        return bBalanceUsd - (aBalanceUsd ?? 0n) > 0 ? 1 : -1;
      }
      return 0;
    });

    const sortedTokensWithoutBalance = tokensWithoutBalance.sort((a, b) => {
      const aInfo = infoTokens?.[a.address];
      const bInfo = infoTokens?.[b.address];

      if (!aInfo || !bInfo) return 0;

      if (extendedSortSequence) {
        // making sure to use the wrapped address if it exists in the extended sort sequence
        const aAddress =
          aInfo.wrappedAddress && extendedSortSequence.includes(aInfo.wrappedAddress)
            ? aInfo.wrappedAddress
            : aInfo.address;

        const bAddress =
          bInfo.wrappedAddress && extendedSortSequence.includes(bInfo.wrappedAddress)
            ? bInfo.wrappedAddress
            : bInfo.address;

        return extendedSortSequence.indexOf(aAddress) - extendedSortSequence.indexOf(bAddress);
      }

      return 0;
    });

    return [...sortedTokensWithBalance, ...sortedTokensWithoutBalance];
  }, [filteredTokens, infoTokens, extendedSortSequence, showBalances]);

  const _handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      if (filteredTokens.length > 0) {
        onSelectToken(filteredTokens[0]);
      }
    }
  };

  if (!tokenInfo) {
    return null;
  }

  return (
    <div className={cx("TokenSelector", { disabled }, props.className)} onClick={(event) => event.stopPropagation()}>
      <Modal
        qa={qa + "-modal"}
        isVisible={isModalVisible}
        setIsVisible={setIsModalVisible}
        label={props.label}
        footerContent={footerContent}
        headerContent={
          <SearchInput className="mt-15" value={searchKeyword} setValue={setSearchKeyword} onKeyDown={_handleKeyDown} />
        }
      >
        {missedCoinsPlace && (
          <WithMissedCoinsSearch
            searchKeyword={searchKeyword}
            place={missedCoinsPlace}
            isEmpty={!filteredTokens.length}
            isLoaded={Boolean(visibleTokens.length)}
          />
        )}
        <div className="TokenSelector-tokens">
          {sortedFilteredTokens.map((token, tokenIndex) => {
            let info = infoTokens?.[token.address] || ({} as TokenInfo);

            let mintAmount;
            let balance = info.balance;
            if (showMintingCap && mintingCap !== undefined && info.usdgAmount !== undefined) {
              mintAmount = mintingCap - info.usdgAmount;
            }
            if (mintAmount && mintAmount < 0) {
              mintAmount = 0n;
            }
            let balanceUsd: bigint | undefined = undefined;
            if (balance !== undefined && info.maxPrice !== undefined) {
              balanceUsd = bigMath.mulDiv(balance, info.maxPrice, expandDecimals(1, token.decimals));
            }

            const tokenState = getTokenState(info) || {};
            const marketToken = Object.values(marketsInfoData ?? {}).find(
              (market) => market.marketTokenAddress === token.address
            );
            const tokenBadge = token.isMarketToken && marketToken ? getMarketBadge(chainId, marketToken) : undefined;

            return (
              <div
                key={token.address}
                data-qa={`${qa}-token-${token.symbol}`}
                className={cx("TokenSelector-token-row", { disabled: tokenState.disabled })}
                onClick={() => !tokenState.disabled && onSelectToken(token)}
              >
                {tokenState.disabled && tokenState.message && (
                  <TooltipWithPortal
                    className="TokenSelector-tooltip"
                    handle={<div className="TokenSelector-tooltip-backing" />}
                    position={tokenIndex < filteredTokens.length / 2 ? "bottom" : "top"}
                    disableHandleStyle
                    closeOnDoubleClick
                    fitHandleWidth
                    renderContent={() => tokenState.message}
                  />
                )}
                <div className="Token-info">
                  {showTokenImgInDropdown && (
                    <TokenIcon
                      symbol={token.symbol}
                      className="token-logo"
                      displaySize={40}
                      importSize={40}
                      badge={tokenBadge}
                    />
                  )}
                  <div className="Token-symbol">
                    <div className="Token-text">{token.isMarketToken ? "GM" : token.symbol}</div>
                    <span className="text-accent">{token.name}</span>
                  </div>
                </div>
                <div className="Token-balance">
                  {(showBalances && balance !== undefined && (
                    <div className="Token-text">
                      {balance > 0 && formatAmount(balance, token.decimals, 4, true)}
                      {balance == 0n && "-"}
                    </div>
                  )) ||
                    null}
                  <span className="text-accent">
                    {mintAmount && <div>Mintable: {formatAmount(mintAmount, token.decimals, 2, true)} USDG</div>}
                    {showMintingCap && !mintAmount && <div>-</div>}
                    {!showMintingCap && showBalances && balanceUsd !== undefined && balanceUsd > 0 && (
                      <div>${formatAmount(balanceUsd, 30, 2, true)}</div>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        {sortedFilteredTokens.length === 0 && (
          <div className="text-16 text-gray-400">
            <Trans>No tokens matched.</Trans>
          </div>
        )}
      </Modal>
      {selectedTokenLabel ? (
        <div data-qa={qa} className="TokenSelector-box" onClick={() => setIsModalVisible(true)}>
          {selectedTokenLabel}
          {!showNewCaret && <BiChevronDown className="TokenSelector-caret" />}
        </div>
      ) : (
        <div data-qa={qa} className="TokenSelector-box" onClick={() => setIsModalVisible(true)}>
          <span className="inline-flex items-center">
            {showSymbolImage && (
              <TokenIcon className="mr-5" symbol={tokenInfo.symbol} importSize={24} displaySize={20} />
            )}
            <span className="Token-symbol-text">{showTokenName ? tokenInfo.name : tokenInfo.symbol}</span>
          </span>
          {showNewCaret && <img src={dropDownIcon} alt="Dropdown Icon" className="TokenSelector-box-caret" />}
          {!showNewCaret && <BiChevronDown className="TokenSelector-caret" />}
        </div>
      )}
    </div>
  );
}
