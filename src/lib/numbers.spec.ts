import { USD_DECIMALS } from "config/factors";
import { bigintToNumber, numberToBigint, formatUsdPrice, PRECISION, formatAmountHuman } from "./numbers";
import { describe, expect, it } from "vitest";

describe("numbers.ts", () => {
  it("bigintToNumber", () => {
    expect(bigintToNumber(0n, 30)).toEqual(0);
    expect(bigintToNumber(1n, 30)).toEqual(1e-30);
    expect(bigintToNumber(PRECISION, 30)).toEqual(1);
    expect(bigintToNumber(PRECISION * 100n, 30)).toEqual(100);
    expect(bigintToNumber(PRECISION * 2n, 30)).toEqual(2);
    expect(bigintToNumber(PRECISION / 2n, 30)).toEqual(0.5);

    expect(bigintToNumber(1123456n, 6)).toEqual(1.123456);
    expect(bigintToNumber(-1123456n, 6)).toEqual(-1.123456);
  });

  it("numberToBigint", () => {
    expect(numberToBigint(0, 30)).toEqual(0n);
    expect(numberToBigint(1e-30, 30)).toEqual(1n);
    expect(numberToBigint(-1e-30, 30)).toEqual(-1n);
    expect(numberToBigint(1, 30)).toEqual(PRECISION);
    expect(numberToBigint(100, 30)).toEqual(PRECISION * 100n);
    expect(numberToBigint(2, 30)).toEqual(PRECISION * 2n);
    expect(numberToBigint(0.5, 30)).toEqual(PRECISION / 2n);
    expect(numberToBigint(-0.5, 30)).toEqual(-PRECISION / 2n);

    expect(numberToBigint(1.1234567, 6)).toEqual(1123456n);
    expect(numberToBigint(1.12345678, 6)).toEqual(1123456n);
    expect(numberToBigint(1.123456789, 6)).toEqual(1123456n);
    expect(numberToBigint(-1.123456789, 6)).toEqual(-1123456n);
  });
});

const ONE_USD = 1000000000000000000000000000000n;

describe("formatUsdPrice", () => {
  it("should tolerate undefined", () => {
    expect(formatUsdPrice()).toBeUndefined();
  });

  it("should return nothing if undefined or negative", () => {
    expect(() => formatUsdPrice(-1n)).toThrowError();
  });

  it("should calculate correct decimals if displayDecimals not passed", () =>
    // prettier-ignore
    {
      expect(formatUsdPrice(ONE_USD * 10000n)).toBe(       "$10,000.00");
      expect(formatUsdPrice(ONE_USD * 1000n)).toBe(         "$1,000.00");
      expect(formatUsdPrice(ONE_USD * 100n)).toBe(            "$100.000");
      expect(formatUsdPrice(ONE_USD * 10n)).toBe(              "$10.0000");
      expect(formatUsdPrice(ONE_USD)).toBe(                     "$1.0000");
      expect(formatUsdPrice(ONE_USD / 10n)).toBe(               "$0.10000");
      expect(formatUsdPrice(ONE_USD / 100n)).toBe(              "$0.010000");
      expect(formatUsdPrice(ONE_USD / 1000n)).toBe(             "$0.0010000");
      expect(formatUsdPrice(ONE_USD / 10_000n)).toBe(           "$0.0001000");
      expect(formatUsdPrice(ONE_USD / 100_000n)).toBe(          "$0.00001000");
      expect(formatUsdPrice(ONE_USD / 1_000_000_000n)).toBe(    "$0.000000001");
      expect(formatUsdPrice(ONE_USD / 10_000_000_000n)).toBe( "< $0.000000001");
    });
});

describe("formatAmountHuman", () => {
  it("positive", () => {
    expect(formatAmountHuman(ONE_USD, USD_DECIMALS)).toBe("1.0");
    expect(formatAmountHuman(ONE_USD * 1000n, USD_DECIMALS)).toBe("1.0K");
    expect(formatAmountHuman(ONE_USD * 1000000n, USD_DECIMALS)).toBe("1.0M");
  });

  it("negative", () => {
    expect(formatAmountHuman(-1n * ONE_USD, USD_DECIMALS)).toBe("-1.0");
    expect(formatAmountHuman(-1n * ONE_USD * 1000n, USD_DECIMALS)).toBe("-1.0K");
    expect(formatAmountHuman(-1n * ONE_USD * 1000000n, USD_DECIMALS)).toBe("-1.0M");
  });

  it("should display dollar sign", () => {
    expect(formatAmountHuman(ONE_USD, USD_DECIMALS, true)).toBe("$1.0");
    expect(formatAmountHuman(-1n * ONE_USD, USD_DECIMALS, true)).toBe("-$1.0");
  });

  it("should display decimals", () => {
    expect(formatAmountHuman(ONE_USD * 1000n, USD_DECIMALS, false, 2)).toBe("1.00K");
    expect(formatAmountHuman(ONE_USD * 1500000n, USD_DECIMALS, false, 2)).toBe("1.50M");
    expect(formatAmountHuman(ONE_USD * 1000n, USD_DECIMALS, false, 0)).toBe("1K");
    expect(formatAmountHuman(ONE_USD * 1500000n, USD_DECIMALS, false, 0)).toBe("2M");
  });
});
