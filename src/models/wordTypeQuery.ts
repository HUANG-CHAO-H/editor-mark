import isEqual from "lodash/isEqual";
import {QueryHelper, QueryLoader} from "../utils/QueryHelper";
import {queryClientSingleton} from "../context";

export interface WordTypeInfo {
  // 类型的key(UUID)
  typeKey: string;
  // 类型名称
  name: string;
  // 类型的字体颜色
  color: string;
  // 类型标记的背景颜色
  backgroundColor: string;
  // 类型描述
  description: string;
  // 是否隐藏此类型的标签展示
  hidden?: boolean;
}

export function formatWordTypeInfo(info: Partial<WordTypeInfo> | Record<string, any>): WordTypeInfo {
  return {
    typeKey: info.typeKey || '',
    name: info.name || '',
    color: info.color || '',
    backgroundColor: info.backgroundColor || '',
    description: info.description || '',
    hidden: info.hidden || undefined,
  }
}

export const wordTypeLoader = new QueryLoader({
  async queryFn(): Promise<WordTypeInfo[]> {
    return [];
  },
});

export const wordTypeQuery = new QueryHelper(wordTypeLoader, {
  uniqueKey: 'word-type',
  queryClient: queryClientSingleton,
  cacheTime: Infinity,
  staleTime: Infinity,
}, {
  // 获取目标key所对应的type在数组中的位置(索引)
  getIndexByKey(key: string): number {
    const list = wordTypeQuery.getQueryData();
    if (!list?.length) {
      return -1;
    }
    return list.findIndex(v => v.typeKey === key);
  },

  /**
   * 向前移动
   * @param index 要操作的元素index
   */
  toFront(index: number) {
    const list = wordTypeQuery.getQueryData();
    if (!list?.length || index <= 0 || index >= list.length) {
      return false;
    }
    const arr = [...list];
    const left = arr[index - 1];
    arr[index - 1] = arr[index];
    arr[index] = left;
    wordTypeQuery.setQueryData([], arr);
    return true;
  },

  /**
   * 向后移动
   * @param index 要操作的元素index
   */
  toEnd(index: number) {
    const list = wordTypeQuery.getQueryData();
    if (!list?.length || index < 0 || index >= list.length - 1) {
      return false;
    }
    const arr = [...list];
    const right = arr[index + 1];
    arr[index + 1] = arr[index];
    arr[index] = right;
    wordTypeQuery.setQueryData([], arr);
    return true;
  },

  /**
   * 追加元素
   */
  push(info: WordTypeInfo) {
    const attr = [...(wordTypeQuery.getQueryData() || []), info];
    wordTypeQuery.setQueryData([], attr);
  },

  /**
   * 更新元素数据
   * @param index 要更新的元素
   * @param item  要更新的内容
   */
  update(index: number, item: Partial<WordTypeInfo>) {
    const oldV = wordTypeQuery.getQueryData();
    if (!oldV?.length || index < 0 || index >= oldV.length) {
      return false;
    }
    const arr = [...oldV];
    arr[index] = formatWordTypeInfo({
      ...arr[index],
      ...item,
    });
    wordTypeQuery.setQueryData([], arr);
    return true;
  },

  /**
   * 删除元素
   * @param index 要追加的元素
   */
  delete(index: number) {
    const oldV = wordTypeQuery.getQueryData();
    if (!oldV?.length || index < 0 || index >= oldV.length) {
      return false;
    }
    const arr = [...oldV];
    arr.splice(index, 1);
    wordTypeQuery.setQueryData([], arr);
    return true;
  },

  /**
   * 隐藏目标标签类型
   */
  hide(index: number): boolean {
    return wordTypeQuery.run('update', index, { hidden: true });
  },

  /**
   * 展示目标标签类型
   */
  show(index: number): boolean {
    return wordTypeQuery.run('update', index, { hidden: undefined });
  },

  /**
   * 隐藏所有类型
   */
  batchUpdate(
    updater: (value: WordTypeInfo, index: number) => WordTypeInfo,
  ) {
    const oldV = wordTypeQuery.getQueryData();
    if (!oldV?.length) {
      return oldV;
    }
    const arr: WordTypeInfo[] = Array(oldV.length);
    let hasChange = false;
    for (let i = 0; i < arr.length; i++) {
      arr[i] = updater(oldV[i], i);
      if (isEqual(oldV[i], arr[i])) {
        arr[i] = oldV[i];
      } else {
        hasChange = true;
      }
    }
    if (hasChange) {
      wordTypeQuery.setQueryData([], arr);
    }
    return true;
  },
});

wordTypeQuery.setQueryData([], [
  { typeKey: 'WTK01', name: '测试-01', color: '#ffd43b', backgroundColor: '', description: '这是一段测试' },
  { typeKey: 'WTK02', name: '测试-02', color: '#69db7c', backgroundColor: '', description: '这是一段测试' },
  { typeKey: 'WTK03', name: '测试-03', color: '#9775fa', backgroundColor: '', description: '这是一段测试' },
  { typeKey: 'WTK04', name: '测试-04', color: '#748ffc', backgroundColor: '', description: '这是一段测试' },
]);

