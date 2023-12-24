import { QueryState } from 'react-query/types/core/query';

// QueryLoader的接口类型, 可以实现此类型来自定义loader
export interface QueryLoaderInterface<
  // 查询函数的入参;
  QI extends any[] = [],
  // 查询函数的返回值
  QD extends object = object,
> {
  // 适配react-query的数据加载函数
  queryFn(c: { queryKey: [string, ...QI] }): Promise<QD | undefined>;
  // 适配 react-query 的数据加载函数(在列表等批量场景下使用)
  batchQueryFn(c: { queryKey: [string, ...QI] }): Promise<QD | undefined>;
  // 查询单条数据
  load(...args: QI): Promise<QD | undefined>;
  // 批量查询数据
  loadMany(...argsArray: QI[]): Promise<(QD | undefined)[]>;
}

/**
 * query查询日志
 */
export interface QueryLoggerInterface {
  log(...data: any[]): void;
  info(...data: any[]): void;
  warn(...data: any[]): void;
  error(...data: any[]): void;
}

// QueryHelper 对外暴露的事件
export interface QueryHelperEvent<QI extends any[] = [], QD extends object = {}> {
  // 数据变更事件
  'data-change': (inputC: QI, newValue: QD | undefined, oldValue: QD | undefined) => void;
  // query的数据added事件
  'query-added': (state: QueryState<QD>, queryKey: string[]) => void;
  // query的数据updated事件
  'query-updated': (state: QueryState<QD>, queryKey: string[]) => void;
  // query的数据removed事件
  'query-removed': (state: QueryState<QD>, queryKey: string[]) => void;
  // 数据订阅者数量变更时的回调函数
  'observer-count-change': (count: number, queryKey: string[]) => void;
  // 查询失败的回调函数(query函数返回undefined也将视为查询失败)
  // 'query-failed': (reason: any, queryKey: string[]) => void;
}
