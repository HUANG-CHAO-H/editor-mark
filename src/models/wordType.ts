import {useEffect, useMemo, useState} from "react";

export interface WordTypeInfo {
  // 类型的key(UUID)
  typeKey: string;
  // 类型名称
  name: string;
  // 类型的字体颜色
  color: string;
  // 类型标记的背景颜色
  backGroundColor: string;
  // 类型描述
  description: string;
}

export function formatWordTypeInfo(info: Partial<WordTypeInfo> | Record<string, any>): WordTypeInfo {
  return {
    typeKey: info.typeKey || '',
    name: info.name || '',
    color: info.color || '',
    backGroundColor: info.backGroundColor || '',
    description: info.description || '',
  }
}

export class WordTypeHelper {
  // word类型数组
  protected array: WordTypeInfo[];
  // array数组的版本号
  protected version: number;
  // 缓存空间
  protected cacheRecord: Record<string, any> = {};
  // 数组变更监听函数
  protected eventListeners = new Set<(arr: WordTypeInfo[]) => void>();

  get list(): WordTypeInfo[] {
    if (this.version !== this.cacheRecord.list_version) {
      this.cacheRecord.list_array = [...this.array];
      this.cacheRecord.list_version = this.version;
    }
    return this.cacheRecord.list_array;
  }

  constructor(arr: WordTypeInfo[]) {
    this.array = arr;
    this.version = 0;
  }

  /**
   * 向前移动
   * @param index 要操作的元素index
   */
  toFront(index: number) {
    if (index <= 0) {
      return false;
    } else if (index >= this.array.length) {
      return false;
    }
    const left = this.array[index - 1];
    this.array[index - 1] = this.array[index];
    this.array[index] = left;
    this.version++;
    this.dispatch();
    return true;
  }

  /**
   * 向后移动
   * @param index 要操作的元素index
   */
  toEnd(index: number) {
    if (index < 0) {
      return false;
    } else if (index >= this.array.length - 1) {
      return false;
    }
    const right = this.array[index + 1];
    this.array[index + 1] = this.array[index];
    this.array[index] = right;
    this.version++;
    this.dispatch();
    return true;
  }

  /**
   * 追加元素
   * @param item  要追加的元素
   */
  push(item: WordTypeInfo) {
    const v = this.array.push(item);
    this.version++;
    this.dispatch();
    return v;
  }

  /**
   * 更新元素数据
   * @param index 要更新的元素
   * @param item  要更新的内容
   */
  update(index: number, item: Partial<WordTypeInfo>) {
    if (index < 0) {
      return false;
    } else if (index >= this.array.length) {
      return false;
    }
    this.array[index] = formatWordTypeInfo({
      ...this.array[index],
      ...item,
    });
    this.version++;
    this.dispatch();
    return true;
  }

  /**
   * 删除元素
   * @param index 要追加的元素
   */
  delete(index: number) {
    if (index < 0) {
      return false;
    } else if (index >= this.array.length) {
      return false;
    }
    this.array.splice(index, 1);
    this.version++;
    this.dispatch();
    return true;
  }

  addListener(cb: (arr: WordTypeInfo[]) => void) {
    return this.eventListeners.add(cb);
  }

  removeListener(cb: (arr: WordTypeInfo[]) => void) {
    return this.eventListeners.delete(cb);
  }

  dispatch() {
    for (const listener of this.eventListeners) {
      listener(this.list);
    }
  }
}

export function useWordTypeHelper(data: WordTypeHelper | WordTypeInfo[]) {
  const helper = useMemo(() => {
    if (data instanceof WordTypeHelper) {
      return data;
    }
    return new WordTypeHelper(data);
  }, [data]);
  const [refresh, setRefresh] = useState(Number.MIN_SAFE_INTEGER);
  useEffect(() => {
    const cb = () => setRefresh(v => v + 1);
    helper.addListener(cb);
    return () => void helper.removeListener(cb);
  }, [helper]);
  return [helper, refresh, setRefresh] as const;
}
