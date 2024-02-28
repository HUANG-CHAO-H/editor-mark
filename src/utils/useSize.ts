import {
  MutableRefObject,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

/**
 * 尺寸类型
 * 1. scroll: 容器内部的总宽/高度(包含滚动轴高度) + 容器的padding
 * 2. client: 容器内部的可见宽/高度 + 容器的padding
 * 3. offset: 容器内部的可见宽/高度 + 容器的padding + 容器的border + 滚动条
 */
export type SizeType = 'scroll' | 'client' | 'offset';

export interface UseSizeOptions<T extends HTMLElement> {
  ref?: MutableRefObject<T | null>;
  // 是否监听宽度
  widthType?: SizeType;
  // 是否监听高度
  heightType?: SizeType;
  // 监听间隔
  throttle?: number;
  // 默认宽度
  defaultWidth?: number;
  // 默认高度
  defaultHeight?: number;
  // 是否在立刻获取元素的尺寸(而不是在等待throttle间隔之后), 用来控制初始化逻辑
  immediate?: boolean;
}

/**
 * 获取dom元素的尺寸
 * @param options
 */
export function useSize<
  T extends HTMLElement = HTMLElement
>(options: UseSizeOptions<T>) {
  const [size, setSize] = useState({
    width: options.defaultWidth || 0,
    height: options.defaultHeight || 0,
  })
  const ref = useRef<T | null>(null);
  useLayoutEffect(() => {
    const domRef = options.ref || ref;
    const wKey = options.widthType ? `${options.widthType}Width` : '';
    const hKey = options.heightType ? `${options.heightType}Height` : '';
    const handler = () => {
      const dom = domRef.current;
      if (!dom) {
        return;
      }
      const w: number = wKey ? (dom as any)[wKey] : 0;
      const h: number = hKey ? (dom as any)[hKey] : 0;
      setSize(oldV => {
        if (oldV.width === w && oldV.height === h) {
          return oldV;
        }
        return { width: w, height: h }
      })
    }
    if (options.immediate) {
      handler();
    }
    const interval = setInterval(handler, options.throttle || 100);
    return () => clearInterval(interval);
  }, [
    options.heightType,
    options.immediate,
    options.ref,
    options.throttle,
    options.widthType,
  ]);
  return [options.ref || ref, size] as const;
}
