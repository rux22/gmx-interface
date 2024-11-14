import { isDevelopment } from "config/env";
import { METRICS_PENDING_EVENTS_KEY as CACHED_METRICS_DATA_KEY, METRICS_TIMERS_KEY } from "config/localStorage";
import {
  BatchReportItem,
  CounterPayload,
  OracleFetcher,
  TimingPayload,
  UiReportPayload,
} from "lib/oracleKeeperFetcher/types";
import { deserializeBigIntsInObject, serializeBigIntsInObject } from "lib/numbers";
import { sleep } from "lib/sleep";
import { getAppVersion } from "lib/version";
import { getWalletNames, WalletNames } from "lib/wallets/getWalletNames";
import {
  METRIC_COUNTER_DISPATCH_NAME,
  METRIC_TIMING_DISPATCH_NAME,
  METRIC_EVENT_DISPATCH_NAME,
} from "./emitMetricEvent";
import { prepareErrorMetricData } from "./errorReporting";
import { getStorageItem, setStorageItem } from "./storage";
import { ErrorEvent, GlobalMetricData, LongTaskTiming } from "./types";

export type MetricEventParams = {
  event: string;
  data?: object;
  time?: number;
  isError?: boolean;
  isCounter?: boolean;
  isTiming?: boolean;
};

const MAX_METRICS_STORE_TIME = 1000 * 60; // 1 min
const MAX_QUEUE_LENGTH = 500;
const MAX_BATCH_LENGTH = 100;
const BATCH_INTERVAL_MS = 1000;
const BANNED_CUSTOM_FIELDS = ["metricId"];
const BAD_REQUEST_ERROR = "BadRequest";

type CachedMetricData = { _metricDataCreated: number; metricId: string };
type CachedMetricsData = { [key: string]: CachedMetricData };
type Timers = { [key: string]: number };

export class Metrics {
  fetcher?: OracleFetcher;
  debug = false;
  globalMetricData: GlobalMetricData = {} as GlobalMetricData;
  queue: BatchReportItem[] = [];
  wallets?: WalletNames;
  eventIndex = 0;
  isProcessing = false;
  performanceObserver?: PerformanceObserver;

  static _instance: Metrics;

  static get instance() {
    if (!Metrics._instance) {
      Metrics._instance = new Metrics();
    }

    return Metrics._instance;
  }

  setFetcher = (fetcher: OracleFetcher) => {
    this.fetcher = fetcher;

    if (this.queue.length > 0 && !this.isProcessing) {
      this._processQueue();
    }
  };

  setDebug = (val: boolean) => {
    this.debug = val;
  };

  setGlobalMetricData = (meta: GlobalMetricData) => {
    this.globalMetricData = { ...this.globalMetricData, ...meta };
  };

  async updateWalletNames() {
    this.wallets = await getWalletNames();
  }

  // Require Generic type to be specified
  pushEvent = <T extends MetricEventParams = never>(params: T) => {
    const { time, isError, data, event } = params;

    const payload = {
      isDev: isDevelopment(),
      host: window.location.host,
      url: window.location.href,
      event: event,
      version: getAppVersion(),
      isError: Boolean(isError),
      time,
      customFields: {
        ...(data ? this.serializeCustomFields(data) : {}),
        ...this.globalMetricData,
        wallets: this.wallets,
      },
    } as UiReportPayload;

    if (this.debug) {
      // eslint-disable-next-line no-console
      console.log(`Metrics: push event`, event, payload);
    }

    this.queue.push({
      type: "event",
      payload,
    });
  };

  pushCounter<T extends { event: string; data?: object } = never>(event: T["event"], data?: T["data"]) {
    this.queue.push({
      type: "counter",
      payload: {
        event,
        isDev: isDevelopment(),
        host: window.location.host,
        url: window.location.href,
        version: getAppVersion(),
        abFlags: this.globalMetricData.abFlags,
        customFields: data ? this.serializeCustomFields(data) : undefined,
      } as CounterPayload,
    });
  }

  pushTiming<T extends { event: string; data?: object } = never>(event: T["event"], time: number, data?: T["data"]) {
    this.queue.push({
      type: "timing",
      payload: {
        event,
        isDev: isDevelopment(),
        host: window.location.host,
        url: window.location.href,
        version: getAppVersion(),
        time,
        abFlags: this.globalMetricData.abFlags,
        customFields: data ? this.serializeCustomFields(data) : undefined,
      } as TimingPayload,
    });
  }

  pushError = (error: unknown, errorSource: string) => {
    const errorData = prepareErrorMetricData(error);

    if (!errorData) {
      return;
    }

    const event: ErrorEvent = {
      event: "error",
      isError: true,
      data: {
        ...errorData,
        errorSource,
      },
    };

    if (this.debug) {
      // eslint-disable-next-line no-console
      console.log("Metrics: error event", event);
    }

    this.pushEvent(event);
  };

  _processQueue = async () => {
    this.isProcessing = true;

    if (!this.fetcher) {
      if (this.debug) {
        // eslint-disable-next-line no-console
        console.log("Metrics: fetcher is not initialized");
      }
      return sleep(BATCH_INTERVAL_MS).then(this._processQueue);
    }

    if (this.queue.length === 0) {
      if (this.debug) {
        // eslint-disable-next-line no-console
        console.log("Metrics: queue is empty");
      }
      return sleep(BATCH_INTERVAL_MS).then(this._processQueue);
    }

    // Avoid infinite queue growth
    if (this.queue.length > MAX_QUEUE_LENGTH) {
      this.queue = this.queue.slice(-MAX_QUEUE_LENGTH);
      if (this.debug) {
        // eslint-disable-next-line no-console
        console.log("Metrics: Slice queue");
      }
    }

    const items = this.queue.slice(0, MAX_BATCH_LENGTH);
    this.queue = this.queue.slice(MAX_BATCH_LENGTH - 1);

    if (this.debug) {
      // eslint-disable-next-line no-console
      console.log(`Metrics: send batch metrics: ${items.length} items`);
    }

    return this.fetcher
      .fetchPostBatchReport({ items }, this.debug)
      .then(async (res) => {
        if (res.status === 400) {
          const errorData = await res.json();

          const error = new Error(JSON.stringify(errorData));
          error.name = BAD_REQUEST_ERROR;
        }

        if (!res.ok) {
          throw new Error(res.statusText);
        }
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error(`Metrics: Error sending batch metrics`, error);

        if (error.name === BAD_REQUEST_ERROR) {
          this.pushError(error, "Metrics");
        } else {
          this.queue.push(...items);
        }
      })
      .finally(() => sleep(BATCH_INTERVAL_MS).then(this._processQueue));
  };

  subscribeToEvents = () => {
    window.addEventListener(METRIC_EVENT_DISPATCH_NAME, this.handleWindowEvent);
    window.addEventListener(METRIC_COUNTER_DISPATCH_NAME, this.handleWindowCounter);
    window.addEventListener(METRIC_TIMING_DISPATCH_NAME, this.handleWindowTiming);
    window.addEventListener("error", this.handleError);
    window.addEventListener("unhandledrejection", this.handleUnhandledRejection);
    this.subscribeToLongTasks();
  };

  unsubscribeFromEvents = () => {
    window.removeEventListener(METRIC_EVENT_DISPATCH_NAME, this.handleWindowEvent);
    window.removeEventListener(METRIC_COUNTER_DISPATCH_NAME, this.handleWindowCounter);
    window.removeEventListener(METRIC_TIMING_DISPATCH_NAME, this.handleWindowTiming);
    window.removeEventListener("error", this.handleError);
    window.removeEventListener("unhandledrejection", this.handleUnhandledRejection);
    this.performanceObserver?.disconnect();
  };

  subscribeToLongTasks = () => {
    if (typeof PerformanceObserver === "undefined") {
      this.pushError("PerformanceObserver is not supported, skip", "subscribeToLongTasks");
      return;
    }

    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        try {
          list.getEntries().forEach((entry) => {
            if (entry.name === "self") {
              this.pushTiming<LongTaskTiming>("longtasks.self.timing", entry.duration, {
                isInitialLoad: performance.now() < 20000,
              });
              if (this.debug) {
                // eslint-disable-next-line no-console
                console.debug("Metrics: longTask duration", entry.duration);
              }
            }
          });
        } catch (error) {
          this.pushError(error, "subscribeToLongTasks");
          this.performanceObserver?.disconnect();
        }
      });

      this.performanceObserver.observe({ entryTypes: ["longtask"], buffered: true });
    } catch (error) {
      this.pushError(error, "subscribeToLongTasks");
      this.performanceObserver?.disconnect();
    }
  };

  handleWindowEvent = (event: Event) => {
    const { detail } = event as CustomEvent;
    this.pushEvent<MetricEventParams>(detail);
  };

  handleWindowCounter = (event: Event) => {
    const { detail } = event as CustomEvent;
    this.pushCounter<any>(detail.event, detail.data);
  };

  handleWindowTiming = (event: Event) => {
    const { detail } = event as CustomEvent;
    this.pushTiming<any>(detail.event, detail.time, detail.data);
  };

  handleError = (event) => {
    const error = event.error;

    if (error) {
      this.pushError(error, "globalError");
    }
  };

  handleUnhandledRejection = (event) => {
    const error = event.reason;

    if (error) {
      this.pushError(error, "unhandledRejection");
    }
  };

  // Require Generic type to be specified
  setCachedMetricData = <TData extends { metricId: string } = never>(metricData: TData): TData & CachedMetricData => {
    const { metricId } = metricData;

    const cachedMetricsData = getStorageItem(CACHED_METRICS_DATA_KEY);
    const metricsData: CachedMetricsData = cachedMetricsData
      ? this.deserializeCachedMetricsData(cachedMetricsData)
      : {};

    const cached = { _metricDataCreated: Date.now(), ...metricData };
    metricsData[metricId] = cached;

    setStorageItem(CACHED_METRICS_DATA_KEY, this.serializeCachedMetricsData(metricsData));

    return cached;
  };

  // Require Generic type to be specified
  getCachedMetricData = <TData extends { metricId: string } = never>(
    metricId: TData["metricId"],
    clear?: boolean
  ): (CachedMetricData & TData) | undefined => {
    const cachedMetricsData = getStorageItem(CACHED_METRICS_DATA_KEY);

    if (!cachedMetricsData) {
      return undefined;
    }

    const metricsData = this.deserializeCachedMetricsData(cachedMetricsData);
    const event = metricsData[metricId];

    if (clear) {
      delete metricsData[metricId];
      setStorageItem(CACHED_METRICS_DATA_KEY, this.serializeCachedMetricsData(metricsData));
    }

    return event as CachedMetricData & TData;
  };

  startTimer = (label: string, fromLocalStorage = false) => {
    const storedTimers = getStorageItem(METRICS_TIMERS_KEY, fromLocalStorage);
    const timers = storedTimers ? JSON.parse(storedTimers) : {};

    timers[label] = Date.now();

    setStorageItem(METRICS_TIMERS_KEY, JSON.stringify(this.clearOldTimers(timers)));
  };

  getTime = (label: string, clear?: boolean, fromLocalStorage = false) => {
    const storedTimers = getStorageItem(METRICS_TIMERS_KEY, fromLocalStorage);

    if (!storedTimers) {
      return undefined;
    }

    const timers = JSON.parse(storedTimers);
    const time = timers[label];

    if (!time) {
      return undefined;
    }

    if (clear) {
      delete timers[label];
      setStorageItem(METRICS_TIMERS_KEY, JSON.stringify(this.clearOldTimers(timers)));
    }

    return Date.now() - time;
  };

  serializeCachedMetricsData = (metricsData: CachedMetricsData) => {
    return JSON.stringify(serializeBigIntsInObject(this.clearOldMetrics(metricsData)));
  };

  deserializeCachedMetricsData = (jsonStr: string): CachedMetricsData => {
    return deserializeBigIntsInObject(JSON.parse(jsonStr));
  };

  clearOldMetrics = (metricsData: CachedMetricsData) => {
    const result: { [key: string]: CachedMetricData } = {};

    Object.keys(metricsData).forEach((key) => {
      if (metricsData[key] && Date.now() - metricsData[key]._metricDataCreated < MAX_METRICS_STORE_TIME) {
        result[key] = metricsData[key];
      }
    });

    return result;
  };

  clearOldTimers = (timers: Timers) => {
    const result: { [key: string]: number } = {};

    Object.keys(timers).forEach((key) => {
      if (Date.now() - timers[key] < MAX_METRICS_STORE_TIME) {
        result[key] = timers[key];
      }
    });

    return result;
  };

  serializeCustomFields = (fields: object) => {
    return Object.entries(fields).reduce((acc, [key, value]) => {
      if (BANNED_CUSTOM_FIELDS.includes(key)) {
        return acc;
      }

      if (typeof value === "bigint") {
        value = value.toString();
      }

      const charLimit = key === "errorStack" ? 2000 : 500;
      if (typeof value === "string" && value.length > charLimit) {
        value = value.slice(0, charLimit);
      }

      acc[key] = value;

      return acc;
    }, {});
  };
}

export const metrics = Metrics.instance;
