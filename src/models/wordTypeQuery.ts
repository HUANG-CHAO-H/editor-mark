import isEqual from "lodash/isEqual";
import {QueryHelper, QueryLoader} from "../utils/QueryHelper";
import {queryClientSingleton} from "../context/QueryProvider/queryClientSingleton";

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
  // 子孙结点
  children?: WordTypeInfo[];
}

export function formatWordTypeInfo(info: Partial<WordTypeInfo> | Record<string, any>): WordTypeInfo {
  return {
    typeKey: info.typeKey || '',
    name: info.name || '',
    color: info.color || '',
    backgroundColor: info.backgroundColor || '',
    description: info.description || '',
    hidden: info.hidden || undefined,
    children: info.children || undefined,
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
   * 交换两个元素的位置
   * @param aIndex  元素a的索引
   * @param bIndex  元素b的索引
   * @param parentIndex 父级元素的index(如果不存在则返回undefined)
   */
  exchange2Item(aIndex: number, bIndex: number, parentIndex?: number) {
    const list = wordTypeQuery.getQueryData();
    if (!list?.length) {
      return false;
    }
    if (parentIndex === undefined) {
      const newArr = exchangeArrayItem(list, aIndex, bIndex);
      if (list === newArr) {
        return false;
      }
      wordTypeQuery.setQueryData([], newArr);
      return true;
    }
    if (parentIndex >= list.length) {
      return false;
    }
    const children = list[parentIndex].children;
    if (!children?.length) {
      return false;
    }
    const newChildren = exchangeArrayItem(children, aIndex, bIndex);
    if (children === newChildren) {
      return false;
    }

    const copyList = [...list];
    copyList[parentIndex] = {
      ...copyList[parentIndex],
      children: newChildren,
    }
    wordTypeQuery.setQueryData([], copyList);
    return true;
  },

  /**
   * 向前移动
   * @param index 要操作的元素index
   * @param parentIndex 父级元素的index(如果不存在则返回undefined)
   */
  toFront(index: number, parentIndex?: number): boolean {
    return wordTypeQuery.run('exchange2Item', index - 1, index, parentIndex);
  },

  /**
   * 向后移动
   * @param index 要操作的元素index
   * @param parentIndex 父级元素的index(如果不存在则返回undefined)
   */
  toEnd(index: number, parentIndex?: number): boolean {
    return wordTypeQuery.run('exchange2Item', index, index + 1, parentIndex);
  },

  /**
   * 追加元素
   */
  push(info: WordTypeInfo, parentIndex?: number) {
    const list = wordTypeQuery.getQueryData();
    if (!list?.length) {
      if (parentIndex !== undefined) {
        return false;
      }
      wordTypeQuery.setQueryData([], [info]);
      return true;
    }
    if (parentIndex === undefined) {
      const attr = [...list, info];
      wordTypeQuery.setQueryData([], attr);
      return true;
    }

    const copyList = [...list];
    const children = copyList[parentIndex].children;
    if (!children?.length) {
      copyList[parentIndex] = {
        ...copyList[parentIndex],
        children: [info],
      }
    } else {
      copyList[parentIndex] = {
        ...copyList[parentIndex],
        children: [...children, info],
      }
    }

    wordTypeQuery.setQueryData([], copyList);
    return true;
  },

  /**
   * 更新元素数据
   * @param index 要更新的元素
   * @param item  要更新的内容
   * @param parentIndex 父级元素的index(如果不存在则返回undefined)
   */
  update(index: number, item: Partial<WordTypeInfo>, parentIndex?: number) {
    const oldV = wordTypeQuery.getQueryData();
    if (!oldV?.length || index < 0 || (parentIndex !== undefined && parentIndex < 0)) {
      return false;
    }
    if (parentIndex === undefined) {
      if (index >= oldV.length) {
        return false;
      }
      const arr = [...oldV];
      arr[index] = formatWordTypeInfo({
        ...arr[index],
        ...item,
      });
      wordTypeQuery.setQueryData([], arr);
      return true;
    }
    if (parentIndex >= oldV.length) {
      return false;
    }
    const array = [...(oldV[parentIndex].children || [])];
    if (index >= array.length) {
      return false;
    }
    array[index] = formatWordTypeInfo({
      ...array[index],
      ...item,
    });
    const arr = [...oldV];
    arr[parentIndex] = {
      ...arr[parentIndex],
      children: array,
    }
    wordTypeQuery.setQueryData([], arr);
    return true;
  },

  /**
   * 批量更新
   */
  batchUpdate(
    updater: (value: WordTypeInfo, index: number, parentIndex?: number) => WordTypeInfo,
  ) {
    const oldV = wordTypeQuery.getQueryData();
    if (!oldV?.length) {
      return;
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
      if (!arr[i].children?.length) {
        continue;
      }
      const children = arr[i].children!;
      const childArr = Array(children.length);
      let hasChildrenChange = false;
      for (let j = 0; j < children.length; j++) {
        childArr[j] = updater(children[j], j, i);
        if (isEqual(children[j], childArr[j])) {
          children[j] = childArr[j];
        } else {
          hasChildrenChange = true;
          hasChange = true;
        }
      }
      if (hasChildrenChange) {
        arr[i] = {
          ...arr[i],
          children,
        }
      }
    }
    if (hasChange) {
      wordTypeQuery.setQueryData([], arr);
    }
  },

  /**
   * 删除元素
   */
  delete(index: number, parentIndex?: number) {
    const oldV = wordTypeQuery.getQueryData();
    if (!oldV?.length || index < 0 || (parentIndex !== undefined && parentIndex < 0)) {
      return false;
    }
    if (parentIndex === undefined) {
      if (index >= oldV.length) {
        return false;
      }
      const newV = [...oldV];
      newV.splice(index, 1);
      wordTypeQuery.setQueryData([], newV);
      return true;
    }
    if (parentIndex >= oldV.length) {
      return false;
    }
    const children = oldV[parentIndex].children;
    if (!children?.length || index >= children.length) {
      return false;
    }
    const copyChildren = [...children];
    copyChildren.splice(index, 1);
    const arr = [...oldV];
    arr[parentIndex] = {
      ...arr[parentIndex],
      children: copyChildren,
    }
    wordTypeQuery.setQueryData([], arr);
    return true;
  },

  /**
   * 隐藏目标标签类型
   */
  hide(index: number, parentIndex?: number): boolean {
    return wordTypeQuery.run('update', index, { hidden: true }, parentIndex);
  },

  /**
   * 隐藏所有标签类型
   */
  hideAll(parentIndex?: number): void {
    if (parentIndex === undefined) {
      return wordTypeQuery.run('batchUpdate', v => ({ ... v, hidden: true }));
    }
    return wordTypeQuery.run('batchUpdate', (v, _ , p) => p === parentIndex ? v : ({ ...v, hidden: true }));
  },

  /**
   * 展示目标标签类型
   */
  show(index: number, parentIndex?: number): boolean {
    return wordTypeQuery.run('update', index, { hidden: undefined }, parentIndex);
  },

  /**
   * 显示所有标签类型
   */
  showAll(parentIndex?: number): void {
    if (parentIndex === undefined) {
      return wordTypeQuery.run('batchUpdate', v => ({ ... v, hidden: undefined }));
    }
    return wordTypeQuery.run('batchUpdate', (v, _ , p) => p === parentIndex ? v : ({ ...v, hidden: undefined }));
  },

  flatArray(): Omit<WordTypeInfo, 'children'>[] {
    const list = wordTypeQuery.getQueryData();
    if (!list) {
      return [];
    }
    const record = wordTypeQuery.getWeakCache(list);
    if (record['flatArray']) {
      return record['flatArray'];
    }
    const array: Omit<WordTypeInfo, 'children'>[] = [];
    for (const item of list) {
      const children = item.children || [];
      array.push({...item, children: undefined } as any);
      for (const child of children) {
        array.push({...child, children: undefined } as any);
      }
    }
    return record['flatArray'] = array;
  }
});

(() => {
  const info = localStorage.getItem('word-type-config');
  if (!info) {
    wordTypeQuery.setQueryData([], []);
    return;
  }
  const formatV = JSON.parse(info);
  if (formatV instanceof Array) {
    wordTypeQuery.setQueryData([], formatV);
  } else {
    wordTypeQuery.setQueryData([], []);
  }
})();

window.addEventListener('beforeunload', () => {
  const data = wordTypeQuery.getQueryData();
  if (data) {
    localStorage.setItem('word-type-config', JSON.stringify(data));
  } else {
    localStorage.removeItem('word-type-config');
  }
});

/**
 * 交换数组中的两个元素
 */
function exchangeArrayItem<T>(array: T[], aIndex: number, bIndex: number) {
  if (!array.length || aIndex === bIndex) {
    return array;
  } else if (aIndex < 0 || aIndex >= array.length) {
    return array;
  } else if (bIndex < 0 || bIndex >= array.length) {
    return array;
  }
  const a = array[aIndex];
  const b = array[bIndex];
  const copyArr = [...array];
  copyArr[aIndex] = b;
  copyArr[bIndex] = a;
  return copyArr;
}
