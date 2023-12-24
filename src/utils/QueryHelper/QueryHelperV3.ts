/* eslint-disable react-hooks/rules-of-hooks */
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  QueryCache,
  QueryClient,
  QueryObserverOptions,
  UseQueryResult,
  useQuery,
  useQueries,
  QueryObserver,
  SetDataOptions,
  QueryKey,
} from 'react-query';
import { Query } from 'react-query/types/core/query';
import { BaseEventEmitter } from '../EventEmitter';
import { QueryLogger } from './QueryLogger';
import {
  hashQueryKey,
  compareArgsArray,
  BatchQueryData,
  defaultBatchQueryData,
  compareArray,
} from './utils';
import type {
  QueryLoaderInterface,
  QueryHelperEvent,
  QueryLoggerInterface,
} from './type';

// QueryHelper的初始化配置
export interface QueryHelperConfig<
  // 查询函数的入参;
  QI extends any[] = [],
  // 查询函数的返回值
  QD extends object = object,
> extends FilterQueryOptions<QI, QD> {
  uniqueKey: string;
  // react query 实例
  queryClient: QueryClient;
  // 自定义日志记录器
  logger?: QueryLoggerInterface;
}

/**
 * react query查询的封装类
 */
export class QueryHelper<
  // 查询函数的入参;
  QI extends any[] = [],
  // 查询函数的返回值
  QD extends object = object,
  // 自定义操作
  O extends Record<string, (...args: any[]) => any> = {},
  // 自定义hooks
  H extends Record<string, (...args: any[]) => any> = {},
> extends BaseEventEmitter<QueryHelperEvent<QI, QD>> {
  // 该query的唯一键
  readonly uniqueKey: string;

  // react query 实例
  readonly queryClient: QueryClient;

  // 自定义日志记录器
  readonly logger: QueryLoggerInterface;

  // query缓存实例
  readonly queryCache: QueryCache;

  // 查询函数
  readonly queryLoader: QueryLoaderInterface<QI, QD>;

  // 查询参数配置
  protected options: FilterQueryOptions<QI, QD>;

  // 预定义的操作集合
  protected operations: O;

  // 预定义的hooks
  protected hooks: H;

  // 缓存空间
  protected weakCache: WeakMap<QD, Record<any, any>> = new WeakMap();

  constructor(
    queryLoader: QueryLoaderInterface<QI, QD>,
    config: QueryHelperConfig<QI, QD>,
    operations = {} as O | (() => O),
    hooks = {} as H | (() => H),
  ) {
    super();
    const {
      queryClient,
      uniqueKey,
      logger = new QueryLogger(this),
      ...queryOptions
    } = config;
    this.uniqueKey = uniqueKey;
    this.queryClient = queryClient;
    this.logger = logger;
    this.queryCache = queryClient.getQueryCache();
    this.queryLoader = queryLoader;
    this.options = {
      ...queryOptions,
      queryKeyHashFn: queryOptions.queryKeyHashFn || hashQueryKey,
    };

    // 预定义operation相关逻辑初始化
    if (typeof operations === 'function') {
      this.operations = operations();
    } else if (typeof operations === 'object') {
      this.operations = operations;
    } else {
      this.operations = {} as O;
    }

    // 预定义hooks相关逻辑初始化
    if (typeof hooks === 'function') {
      this.hooks = hooks();
    } else if (typeof hooks === 'object') {
      this.hooks = hooks;
    } else {
      this.hooks = {} as H;
    }

    // 为了触发data-change而设置的逻辑
    const dataCacheMap: Record<string, QD | undefined> = {};
    let oldValue: QD | undefined;
    let newValue: QD | undefined;
    let queryKeysHash: string;
    const dispatchDataChange = (query: Query<QD>) => {
      queryKeysHash = this.options.queryKeyHashFn!(query.queryKey as any);
      oldValue = dataCacheMap[queryKeysHash];
      newValue = query.state.data;
      if (oldValue !== newValue) {
        dataCacheMap[queryKeysHash] = newValue;
        this.dispatch(
          'data-change',
          this.decodeQueryKey(query.queryKey).params,
          newValue,
          oldValue,
        );
      }
    };

    // 事件监听以及分发;
    this.queryCache.subscribe(event => {
      // 先判断是否是当前query查询的事件;
      if (!event?.query.queryKey?.length || event.query.queryKey[0] !== uniqueKey) {
        return;
      }
      const { type, query } = event;
      switch (type) {
        case 'queryAdded':
          // this.logger.info(this.uniqueKey, 'added', event);
          this.dispatch('query-added', query.state, query.queryKey);
          dispatchDataChange(query);
          break;
        case 'queryUpdated':
          // this.logger.info(this.uniqueKey, 'updated', event);
          this.dispatch('query-updated', query.state, query.queryKey);
          dispatchDataChange(query);
          break;
        case 'queryRemoved':
          // this.logger.info(this.uniqueKey, 'removed', event);
          this.dispatch('query-removed', query.state, query.queryKey);
          dispatchDataChange(query);
          break;
        case 'observerAdded':
          // this.logger.info(this.uniqueKey, 'observerAdded', event);
          this.dispatch('observer-count-change', query.getObserversCount(), query.queryKey);
          break;
        case 'observerResultsUpdated':
          // this.logger.info(this.uniqueKey, 'observerResultsUpdated', event);
          break;
        case 'observerRemoved':
          // this.logger.info(this.uniqueKey, 'observerRemoved', event);
          this.dispatch('observer-count-change', query.getObserversCount(), query.queryKey);
          break;
        default:
          this.logger.warn(this.uniqueKey, 'unknown', event);
      }
    });
  }

  /**
   * 获取 react query的查询参数
   */
  getQueryKey = (...args: QI): [string, ...QI] => [this.uniqueKey, ...args];

  /**
   * 解析queryKey，分解成相关参数
   * @param keys
   */
  decodeQueryKey = (keys: QueryKey) => ({
    uniqueKey: keys[0],
    params: keys.slice(1) as QI,
  });

  /**
   * 获取query查询参数的哈希值
   * @param args
   */
  getHashQueryKey = (...args: QI) => this.options.queryKeyHashFn!(this.getQueryKey(...args));

  /**
   * query查询的hook
   */
  useQuery = <D = QD>(...args: QI): UseQueryResult<QD> & { data?: D } =>
    useQuery(this.getQueryKey(...args), this.queryLoader.queryFn as any, this.options) as any;

  /**
   * react-query 的 useQueries 查询
   * @param args    要查询的query相关参数数组
   */
  useQueries = (args: QI[]) =>
    useQueries(
      args.map(v => ({
        ...this.options,
        queryKey: this.getQueryKey(...v),
        queryFn: this.queryLoader.batchQueryFn as any,
      })),
    );

  /**
   * 批量查询函数, 与 useQueries 不同的是, 返回的结果不是Query数组,而是已经合并好的data数组
   * @param argsArray 查询参数集合
   */
  useBatchQuery = (...argsArray: readonly QI[]) => {
    const staticRef = useRef({
      // 用来标识入参是否发生了变更的参数;
      diffSignal: Number.MIN_SAFE_INTEGER,
      // 保存上一次的入参
      oldArgs: argsArray,
    });
    if (
      !compareArgsArray(staticRef.current.oldArgs, argsArray, this.options.queryKeyHashFn as any)
    ) {
      staticRef.current.diffSignal++;
    }
    const [batchData, setBatchData] = useState<BatchQueryData<QD>>(defaultBatchQueryData);
    useEffect(() => {
      const observerArray: QueryObserver<QD, unknown, QD, QD, [string, ...QI]>[] = [];
      for (const args of argsArray) {
        observerArray.push(
          new QueryObserver(this.queryClient, {
            ...this.options,
            queryKey: this.getQueryKey(...args),
            queryFn: this.queryLoader.batchQueryFn as any,
          }),
        );
      }
      const listener = () => {
        let isFetch = false;
        let isIDLE = false;
        let isLoading = false;
        let isSuccess = false;
        const dataArray: (QD | undefined)[] = [];
        const errorArray: unknown[] = [];
        for (const observer of observerArray) {
          const state = observer.getCurrentQuery().state;
          dataArray.push(state.data);
          errorArray.push(state.error);
          // 有一个查询为 fetching, 则整体就为 fetching;
          isFetch = isFetch || state.isFetching;
          // 只有所有查询都是idle时,整体才为idle;
          isIDLE = isIDLE && !state.isFetching && !state.isPaused;
          // 有一个查询为 loading, 则整体查询就为 loading
          isLoading = isLoading || state.status === 'loading';
          // 只有所有查询都是success, 整体才为success
          isSuccess = isSuccess && state.status === 'success';
        }
        const status = isLoading ? 'loading' : isSuccess ? 'success' : 'error';
        const fetchStatus = isFetch ? 'fetching' : isIDLE ? 'idle' : 'paused';
        setBatchData(oldV => {
          if (
            oldV.status === status &&
            oldV.fetchStatus === fetchStatus &&
            compareArray(oldV.error, errorArray) &&
            compareArray(oldV.data, dataArray)
          ) {
            return oldV;
          }
          return {
            data: dataArray,
            error: errorArray.length ? errorArray : undefined,
            isFetch,
            isLoading,
            isSuccess,
            isError: !isLoading && !isSuccess,
            fetchStatus,
            status,
          };
        });
      };
      for (const observer of observerArray) {
        observer.subscribe(listener);
      }
      return () => {
        for (const observer of observerArray) {
          observer.destroy();
        }
      };
    }, [staticRef.current.diffSignal]);
    return batchData;
  };

  /**
   * 异步拉取query数据(会优先走本地缓存)
   */
  fetchQuery = (...args: QI): Promise<QD> =>
    this.queryClient
      .fetchQuery(this.getQueryKey(...args), this.queryLoader.queryFn as any, this.options)
      .then(v => (v ? v : Promise.reject()));

  /**
   * 拉取远程数据（拉取的过程中会更新本地缓存）
   */
  fetchRemote = async (...args: QI): Promise<QD> => {
    const data = await this.queryLoader.load(...args);
    if (!data) {
      throw new Error(`fetchRemote failed, args = ${JSON.stringify([this.uniqueKey, ...args])}`);
    }
    this.setQueryData(args, data);
    return data;
  }

  /**
   * 批量异步拉取query数据(会优先走本地缓存)
   * @param argsArray 批量拉取时的查询参数
   */
  batchFetchQuery = (argsArray: readonly QI[]) => {
    const promiseArray: Promise<QD | undefined>[] = [];
    for (const args of argsArray) {
      promiseArray.push(
        this.fetchQuery(...args).catch(e => {
          this.logger.error('batchFetchQuery failed, args = ', args, e);
          return undefined;
        })
      );
    }
    return Promise.all(promiseArray);
  };

  /**
   * 批量异步拉取远程数据(会直接先让本地缓存失效，而后拉取远程数据)
   * @param argsArray 批量拉取时的查询参数
   */
  batchFetchRemote = async (argsArray: readonly QI[]) => {
    const batchData = await this.queryLoader.loadMany(...argsArray);
    for (let i = 0; i < argsArray.length; i++) {
      if (batchData[i]) {
        this.setQueryData(argsArray[i], batchData[i] as QD);
      } else {
        this.invalidQuery(...argsArray[i]);
      }
    }
    return batchData;
  };

  /**
   * 设置, 更新本地缓存
   */
  setQueryData = (args: QI, updater: QD | ((oldV: QD | undefined) => QD), options?: SetDataOptions) =>
    this.queryClient.setQueryData(this.getQueryKey(...args), updater, options);

  /**
   * 获取当前query缓存中的数据
   */
  getQueryData = (...args: QI): QD | undefined =>
    this.queryClient.getQueryData<QD>(this.getQueryKey(...args));

  /**
   * 使得指定的缓存失效
   */
  invalidQuery = (...args: QI | []): Promise<void> =>
    this.queryClient.invalidateQueries({
      queryKey: this.getQueryKey(...(args as any)),
    });

  /**
   * 直接移除指定的缓存失效
   */
  removeQuery = (...args: QI) =>
    this.queryClient.removeQueries({ queryKey: this.getQueryKey(...args) });

  /**
   * 变更事件的触发器, 传入一个变更监听函数, 每次出现query数据变更时都会调用此函数,当函数返回true时, 出发State变更
   * @param checkFn 变更监听函数
   */
  useChangeEmitter = (
    checkFn: (inputC: QI, newValue: QD | undefined, oldValue: QD | undefined) => boolean,
  ) => {
    const [refresh, setRefresh] = useState(Number.MIN_SAFE_INTEGER);
    const cacheRef = useRef(checkFn);
    cacheRef.current = checkFn;
    useEffect(() => {
      const handler = (inputC: QI, newValue: QD | undefined, oldValue: QD | undefined) => {
        if (cacheRef.current?.(inputC, newValue, oldValue) === true) {
          setRefresh(v => v + 1);
        }
      };
      this.addListener('data-change', handler);
      return () => this.removeListener('data-change', handler);
    }, []);
    return [refresh, setRefresh] as const;
  };

  /**
   * 带缓存空间的query查询(当数据发生更新后,缓存空间也会被替换)
   */
  useQueryWithCache = (...args: QI): Record<string, any> => {
    const { data, ...res } = this.useQuery(...args);
    const cache = useMemo<Record<string, any>>(() => (data ? this.getWeakCache(data) : {}), [data]);
    return {
      data,
      cache,
      ...res,
    } as UseQueryResult<QD> & { data?: QD; cache: Record<string, any> };
  };

  /**
   * 调用自定义的hooks
   * @param key   要调用的自定义hook的key
   * @param args  改hook需要的额外参数
   */
  useHooks = <K extends keyof H>(key: K, ...args: Parameters<H[K]>): ReturnType<H[K]> =>
    this.hooks[key](...args);

  /**
   * 执行预定义好的某项操作
   * @param key   该操作所对应的key
   * @param args  操作所需要的入参
   */
  run = <K extends keyof O>(key: K, ...args: Parameters<O[K]>): ReturnType<O[K]> =>
    this.operations[key](...args);

  /**
   * 获取目标query当前的observer数量
   */
  getObserversCount(...args: QI) {
    return this.getQuery(...args)?.getObserversCount() || 0;
  }

  // 获取数据对应的缓存空间(对象)
  getWeakCache(data: QD) {
    let cache = this.weakCache.get(data);
    if (!cache) {
      this.weakCache.set(data, (cache = {}));
    }
    return cache;
  }

  addListener<T extends keyof QueryHelperEvent<QI, QD>>(
    type: T,
    handler: QueryHelperEvent<QI, QD>[T],
  ) {
    super.addListener(type, handler, {});
  }

  removeListener<T extends keyof QueryHelperEvent<QI, QD>>(
    type: T,
    handler: QueryHelperEvent<QI, QD>[T],
  ) {
    super.removeListener(type, handler);
  }

  // 获取Query查询实例
  protected getQuery(...args: QI) {
    return this.queryCache.get<QD>(this.getHashQueryKey(...args));
  }
}

// Query查询参数
type QueryOptions<
  // 查询函数的入参;
  QI extends any[] = [],
  // 查询函数的返回值
  QD extends object = object,
> = QueryObserverOptions<QD, unknown, QD, QD, [string, ...QI]>;

// 过滤部分属性之后的查询参数
export type FilterQueryOptions<
  // 查询函数的入参;
  QI extends any[] = [],
  // 查询函数的返回值
  QD extends object = object,
> = Omit<QueryOptions<QI, QD>, 'queryKey'>;
