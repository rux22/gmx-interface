import { TIMEZONE_OFFSET_SEC } from "domain/prices";
import { CHART_PERIODS } from "lib/legacy";
import { Bar } from "./types";

export function getObjectKeyFromValue(value, object) {
  return Object.keys(object).find((key) => object[key] === value);
}

export function formatTimeInBarToMs(bar: Bar) {
  return {
    ...bar,
    time: bar.time * 1000,
  };
}

export function getCurrentCandleTime(period: string) {
  // Converts current time to seconds, rounds down to nearest period, adds timezone offset, and converts back to milliseconds
  const periodSeconds = CHART_PERIODS[period];
  return Math.floor(Date.now() / 1000 / periodSeconds) * periodSeconds + TIMEZONE_OFFSET_SEC;
}

export function getMax(...values: (number | undefined)[]): number {
  return Math.max(...(values.filter((value) => Boolean(value) && typeof value === "number") as number[]));
}

export function getMin(...values: (number | undefined)[]): number {
  return Math.min(...(values.filter((value) => Boolean(value) && typeof value === "number") as number[]));
}

export function multiplyBarValues(bar: Bar, visualMultiplier: number | undefined): Bar {
  if (!visualMultiplier) return bar;

  return {
    ...bar,
    open: bar.open * visualMultiplier,
    close: bar.close * visualMultiplier,
    high: bar.high * visualMultiplier,
    low: bar.low * visualMultiplier,
  };
}

export function getSymbolName(symbolName: string, visualMultiplier = 1): string {
  return visualMultiplier ? `${visualMultiplier}@${symbolName}` : symbolName;
}

export function parseSymbolName(nameWithMultiplier: string): {
  visualMultiplier: number;
  symbolName: string;
} {
  if (nameWithMultiplier.includes("@")) {
    const [multiplier, symbol] = nameWithMultiplier.split("@");
    return {
      visualMultiplier: parseInt(multiplier),
      symbolName: symbol,
    };
  }

  return {
    visualMultiplier: 1,
    symbolName: nameWithMultiplier,
  };
}
