export interface BatchLoadInfo<I, D> {
  key: string;
  input: I;
  data?: D;
  load: boolean;
}

export class BatchLoadHelper<I = unknown, D = unknown> {
  // 所有数据的array
  readonly array: BatchLoadInfo<I, D>[];
  // 所有数据的map
  protected map: Record<string, BatchLoadInfo<I, D>>;

  protected getKey?: (input: I) => string;
  constructor(array: readonly I[], getKey?: (input: I) => string) {
    const loadArray: BatchLoadInfo<I, D>[] = [];
    const loadMap: Record<string, BatchLoadInfo<I, D>> = {};
    let item: BatchLoadInfo<I, D>;
    for (const i of array) {
      item = {
        key: getKey ? getKey(i) : '',
        input: i,
        data: undefined,
        load: false,
      }
      loadArray.push(item);
      if (item.key) {
        loadMap[item.key] = item;
      }
    }
    this.array = loadArray;
    this.map = loadMap;
    this.getKey = getKey;
  }

  // 根据key获取load信息
  getLoadInfoByKey(key: string): BatchLoadInfo<I, D> | undefined {
    return this.map[key];
  }

  // 根据key设置load信息
  setDataByKey(key: string, data: D | undefined, load = true) {
    const item = this.map[key];
    if (!item) {
      return false;
    }
    item.data = data;
    item.load = load;
    return true;
  }

  // 给数据分类, 返回分类之后的record
  classify<T extends string = string>(
    classifyFn: (info: BatchLoadInfo<I, D>, index: number) => T,
  ) {
    const record = {} as Record<T, BatchLoadInfo<I, D>[]>;
    const { array } = this;
    let key: T;
    for (let i = 0; i < array.length; i++) {
      key = classifyFn(array[i], i);
      if (!record[key]) {
        record[key] = [array[i]];
      } else {
        record[key].push(array[i]);
      }
    }
    return record;
  }

  // 获取剩下的所有未加载的数据load
  getUnloadArray() {
    return this.array.filter(v => !v.load);
  }

  // 输出数据
  outputData() {
    return this.array.map(v => v.data);
  }

  [Symbol.iterator]() {
    return this.array[Symbol.iterator]();
  }
}
