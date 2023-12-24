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
});

wordTypeQuery.setQueryData([], [
  { typeKey: 'WTK01', name: '测试-01', color: 'yellow', backGroundColor: '', description: '这是一段测试' },
  { typeKey: 'WTK02', name: '测试-02', color: 'green', backGroundColor: '', description: '这是一段测试' },
  { typeKey: 'WTK03', name: '测试-03', color: 'yellow', backGroundColor: '', description: '这是一段测试' },
  { typeKey: 'WTK04', name: '测试-04', color: 'green', backGroundColor: '', description: '这是一段测试' },
]);

