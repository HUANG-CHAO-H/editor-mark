import React, { useCallback, useMemo, useRef } from 'react';

/**
 * 对ref进行一下简单的包装, 使其更便于书写
 * @param cache 要缓存的数据
 * @param autoCover 是否自动覆盖旧值(即每次执行时都将执行 cacheRef.current = cacheObj )
 */
export function useCacheRef<R>(cache: R, autoCover = true) {
  const cacheRef = useRef<R>(cache);
  autoCover && (cacheRef.current = cache);
  return cacheRef;
}

/**
 * 获取ref上的某个函数
 * @param ref
 * @param key
 */
export function getRefCallback<R, K extends keyof R>(
  ref: React.MutableRefObject<R>,
  key: K,
): R[K] {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return (...args: any[]) => ref.current[key](...args);
}

/**
 * 将ref上面的某个函数持久化,持续更新但引用不变
 * @param ref
 * @param key
 */
export function useRefCallback<R, K extends keyof R>(
  ref: React.MutableRefObject<R>,
  key: K,
): R[K] {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return useCallback((...args: any[]) => ref.current[key](...args), [key, ref]);
}

/**
 * 生成一个Ref实例, 并返回 ref.current 的代理对象, 此代理对象是持久化的, 不会发生改变, 但是针对它的所有增删改查操作都会转移给 ref.current ;
 * 保证代理对象总是等价于 ref.current, 即使 ref.current 的值被整体替换了;
 */
export function useRefObject<R extends Object>(
  initValue: R,
  autoCover = false,
): R {
  const cacheRef = useRef<R>(initValue);
  if (autoCover && cacheRef.current !== initValue) {
    cacheRef.current = initValue;
  }
  return useMemo(
    () =>
      new Proxy<R>({} as any, {
        get: (_: R, p: string | symbol, r: any) =>
          Reflect.get(cacheRef.current, p, r),
        set: (_: R, p: string | symbol, v: any, r: any) =>
          Reflect.set(cacheRef.current, p, v, r),
        apply: (_: R, t: any, a: any[]) =>
          Reflect.apply(cacheRef.current as any, t, a),
        construct: (_: R, a: any[], n: Function) =>
          Reflect.construct(cacheRef.current as any, a, n),
        defineProperty: (_: R, p: string | symbol, a: PropertyDescriptor) =>
          Reflect.defineProperty(cacheRef.current, p, a),
        deleteProperty: (_: R, p: string | symbol) =>
          Reflect.deleteProperty(cacheRef.current, p),
        getOwnPropertyDescriptor: (_: R, p: string | symbol) =>
          Reflect.getOwnPropertyDescriptor(cacheRef.current, p),
        getPrototypeOf: (_: R) => Reflect.getPrototypeOf(cacheRef.current),
        has: (_: R, p: string | symbol) => Reflect.has(cacheRef.current, p),
        isExtensible: (_: R) => Reflect.isExtensible(cacheRef.current),
        ownKeys: (_: R) => Reflect.ownKeys(cacheRef.current),
        preventExtensions: (_: R) =>
          Reflect.preventExtensions(cacheRef.current),
        setPrototypeOf: (_: R, v: Object | null) =>
          Reflect.setPrototypeOf(cacheRef.current, v),
      }),
    [],
  );
}
