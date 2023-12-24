import type { QueryLoggerInterface } from './type';
import type { QueryHelper } from './QueryHelperV3';

export class QueryLogger<
  // 查询函数的入参;
  QI extends any[] = [],
  // 查询函数的返回值
  QD extends object = object,
  // 自定义操作
  O extends Record<string, (...args: any[]) => any> = {},
  // 自定义hooks
  H extends Record<string, (...args: any[]) => any> = {},
> implements QueryLoggerInterface {
  protected readonly helper: QueryHelper<QI, QD, O, H>;

  constructor(helper: QueryHelper<QI, QD, O, H>) {
    this.helper = helper;
  }

  log(...data: any[]) {
    console.log(`[Query Log](${this.helper.uniqueKey})`, ...data);
  }

  info(...data: any[]) {
    console.info(`[Query Info](${this.helper.uniqueKey})`, ...data);
  }

  warn(...data: any[]) {
    console.warn(`[Query Warn](${this.helper.uniqueKey})`, ...data);
  }

  error(...data: any[]) {
      console.error(`[Query Error](${this.helper.uniqueKey})`, ...data);
  }
}
