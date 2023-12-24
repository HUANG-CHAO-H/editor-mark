export interface BatchQueryData<QD extends object = object> {
  data: (QD | undefined)[] | undefined;
  error: unknown[] | undefined;
  isFetch: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  fetchStatus: 'fetching' | 'paused' | 'idle';
  status: 'loading' | 'error' | 'success';
}

export const defaultBatchQueryData: BatchQueryData<any> = {
  data: undefined,
  error: undefined,
  isFetch: true,
  isLoading: true,
  isSuccess: false,
  isError: false,
  fetchStatus: 'fetching',
  status: 'loading',
};

export function hashQueryKey(queryKey: unknown): string {
  return JSON.stringify(queryKey, (_, val) =>
    isPlainObject(val)
      ? Object.keys(val)
        .sort()
        .reduce((result, key) => {
          result[key] = val[key];
          return result;
        }, {} as any)
      : val,
  );
}

export function isPlainObject(o: any): o is Object {
  if (Object.prototype.toString.call(o) !== '[object Object]') {
    return false;
  }

  // If has modified constructor
  const ctor = o.constructor;
  if (typeof ctor === 'undefined') {
    return true;
  }

  // If has modified prototype
  const prot = ctor.prototype;
  if (Object.prototype.toString.call(prot) !== '[object Object]') {
    return false;
  }

  // If constructor does not have an Object-specific method
  if (!prot.hasOwnProperty('isPrototypeOf')) {
    return false;
  }

  // Most likely a plain Object
  return true;
}

/**
 * 比较两个queryKey数组是否相同
 * @param oldV  旧的queryKey数组
 * @param newV  新的queryKey数组
 * @param getHashKey
 */
export function compareArgsArray<QI extends any[] = []>(
  oldV: readonly QI[],
  newV: readonly QI[],
  getHashKey: (array: readonly QI[]) => string,
) {
  if (oldV === newV) {
    return true;
  }
  if (oldV.length !== newV.length) {
    return false;
  }
  for (let i = 0; i < oldV.length; i++) {
    if (oldV[i] === newV[i]) {
      continue;
    }
    if (oldV[i].length !== newV[i].length) {
      return false;
    }
    if (getHashKey(oldV[i]) !== getHashKey(newV[i])) {
      return false;
    }
  }
  return true;
}

/**
 * 浅层比较两个数组是否相等;
 * @param array1  要比较的数组1
 * @param array2  要比较的数组2
 */
export function compareArray<T>(array1?: T[], array2?: T[]) {
  if (array1 === array2) {
    return true;
  }
  if (!array1) {
    return !array2;
  } else if (!array2) {
    return false;
  }
  if (array1.length !== array2.length) {
    return false;
  }
  for (let i = 0; i < array1.length; i++) {
    if (array1[i] !== array2[i]) {
      return false;
    }
  }
  return true;
}
