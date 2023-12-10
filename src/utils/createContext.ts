import { createContext as reactCreateContext } from 'react';

/**
 * react的createContext, 做了一些小改动:
 * 1. 如果不传 defaultValue, 将会生成一个Proxy作为默认值, 该Proxy会直接拦截任何读取或写入操作,然后直接抛错;
 * @param defaultValue  默认值
 * @param contextName   Context的名称
 */
export function createContext<T extends Omit<any, 'undefined'>>(defaultValue?: T, contextName?: string) {
  if (defaultValue) {
    return reactCreateContext<T>(defaultValue);
  }
  return reactCreateContext(new Proxy({} as T, {
    get(_, p: string) {
      throw new Error(`can not read ${p} from global ${contextName || 'Context'}`)
    },
    set(_, p: string): boolean {
      throw new Error(`can not set ${p} to global ${contextName || 'Context'}`)
    }
  }));
}
