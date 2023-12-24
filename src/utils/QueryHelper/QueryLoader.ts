import DataLoader, { Options } from 'dataloader';
import { BatchLoadHelper } from './BatchLoadHelper';
import type { QueryLoaderInterface, QueryLoggerInterface } from './type';
import { hashQueryKey } from './utils';

export interface QueryLoaderConfig<
  // 查询函数的入参;
  QI extends any[] = [],
  // 查询函数的返回值
  QD extends object = object,
> {
  // 查询函数
  queryFn?: (...args: QI) => Promise<QD | undefined>;
  // 批量查询函数
  batchQueryFn?: (batchArgs: QI[]) => Promise<(QD | undefined)[]>;
  // data-loader配置;
  loaderOptions?: Options<QI, QD | undefined, string>;
  // 查询的前置代理(可以自定义拦截部分查询操作, 返回自定义数据)
  proxyQueryBefore?: (...args: QI) => { proxy: boolean; data?: QD };
  // 查询的后置代理(可以自定义拦截部分查询操作的返回, 并去修改它, 然后替换原本的值)
  proxyQueryAfter?: (args: QI, data: QD | undefined) => { proxy: boolean; data?: QD };
  // 告诉TS查询函数的入参是什么(辅助类型推到, 没有实际作用)
  queryInout?: QI;
  // 告诉TS查询函数的返回值是什么(辅助类型推到, 没有实际作用)
  queryOutput?: QD;
  // 自定义日志记录器
  logger?: QueryLoggerInterface;
}

export class QueryLoader<
  // 查询函数的入参;
  QI extends any[] = [],
  // 查询函数的返回值
  QD extends object = object,
> implements QueryLoaderInterface<QI, QD>
{
  readonly loader: DataLoader<QI, QD | undefined, string>;

  // 自定义日志记录器
  readonly logger: QueryLoggerInterface;

  constructor(config: QueryLoaderConfig<QI, QD>) {
    const {
      queryFn,
      batchQueryFn,
      loaderOptions,
      proxyQueryBefore = defaultProxyQueryBefore as (...args: QI) => { proxy: boolean; data?: QD },
      proxyQueryAfter = defaultProxyQueryAfter as (
        args: QI,
        data: QD | undefined,
      ) => { proxy: boolean; data?: QD },
      logger = console,
    } = config;
    this.logger = logger;
    if (!queryFn && !batchQueryFn) {
      throw new Error(
        'QueryLoader Error: queryFn and batchQueryFn can not be empty as a same time',
      );
    }

    const options: Options<QI, QD | undefined, string> = {
      ...loaderOptions,
      batch: Boolean(batchQueryFn),
      cacheKeyFn: hashQueryKey,
      // 关闭data-loader的缓存行为,缓存将由react-query控制, 此时data-loader将失去请求合并和去重的能力;(但还能够批量发请求)
      cache: false,
    };
    // 查询中
    const query = async (loadHelper: BatchLoadHelper<QI, QD>) => {
      const filterArray = loadHelper.getUnloadArray();
      if (!filterArray.length) {
        return;
      } else if (filterArray.length === 1 && queryFn) {
        try {
          filterArray[0].data = await queryFn(...filterArray[0].input);
        } catch (e) {
          this.logger.error(e);
        }
        filterArray[0].load = true;
        return;
      } else if (batchQueryFn) {
        try {
          const resArray = await batchQueryFn(filterArray.map(v => v.input));
          for (let i = 0; i < filterArray.length; i++) {
            filterArray[i].load = true;
            filterArray[i].data = resArray[i];
          }
        } catch (e) {
          this.logger.error(e);
          for (const el of filterArray) {
            el.load = true;
            el.data = undefined;
          }
        }
        return;
      }
      const promiseArr: Promise<any>[] = [];
      for (const info of filterArray) {
        promiseArr.push(
          queryFn!(...info.input)
            .then(v => (info.data = v))
            .catch(e => this.logger.error(e))
            .finally(() => (info.load = true)),
        );
      }
      await Promise.all(promiseArr);
    };
    this.loader = new DataLoader<QI, QD | undefined, string>(async keys => {
      const loadHelper = new BatchLoadHelper<QI, QD>(keys);
      // 查询前置操作
      for (const v of loadHelper) {
        try {
          const res = proxyQueryBefore(...v.input);
          if (res.proxy) {
            v.data = res.data;
            v.load = true;
          }
        } catch (e) {
          this.logger.error(e)
        }
      }
      await query(loadHelper); // ignore_security_alert
      // 查询的后置操作
      for (const v of loadHelper) {
        try {
          const res = proxyQueryAfter(v.input, await v.data);
          if (res.proxy) {
            v.data = res.data;
            v.load = true;
          }
        } catch (e) {
          this.logger.error(e)
        }
      }
      return loadHelper.outputData();
    }, options);
  }

  // 适配react-query的数据加载函数
  queryFn = (c: { queryKey: [string, ...QI] }): Promise<QD | undefined> =>
    this.loader.load(c.queryKey.slice(1) as QI);

  // 适配 react-query 的数据加载函数(在列表等批量场景下使用)
  batchQueryFn = (c: { queryKey: [string, ...QI] }): Promise<QD | undefined> =>
    this.loader.load(c.queryKey.slice(1) as QI);

  // 查询单条数据
  load(...args: QI): Promise<QD | undefined> {
    return this.loader.load(args);
  }

  // 批量查询数据
  loadMany(...argsArray: QI[]): Promise<(QD | undefined)[]> {
    return this.loader.loadMany(argsArray) as Promise<(QD | undefined)[]>;
  }
}

const defaultProxyQueryBefore = () => ({ proxy: false });
const defaultProxyQueryAfter = (_: any, data: any) => ({ proxy: false, data });
