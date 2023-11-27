/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useEffect, useMemo, useRef } from 'react';

/**
 * 最基础的 EventEmitter, 只包含最基本的 添加/移除监听函数, 以及触发事件, 适合用来继承并自定义其它实现
 */
export abstract class BaseEventEmitter<
  EListener extends { [K in keyof EListener]: (...args: any[]) => any },
  EConfig extends Record<any, any> = {},
> {
  // 此实例是否是一个有效实例(无效实例禁止添加和移除事件监听函数, 操作时将会静默失败)
  protected effective: boolean;

  // 此实例是否已经被销毁
  protected isDestroy: boolean;

  // 事件与订阅者
  protected readonly _eventHandlers: Map<
    keyof EListener,
    Map<EListener[keyof EListener], EConfig>
  > = new Map();

  constructor(effective = true) {
    this.effective = effective;
    this.isDestroy = false;
  }

  // 添加事件监听函数
  protected addListener<T extends keyof EListener>(
    type: T,
    handler: EListener[T],
    config: EConfig = {} as EConfig,
  ): void {
    if (this.isDestroy) {
      console.error('This emitter has been destroyed');
      return;
    }
    if (!this.effective) {
      console.warn('this is not a effective Emitter');
      return;
    }
    if (typeof handler !== 'function') {
      console.error(
        'BaseEventEmitter.addListener Error: listener is not a function',
      );
      return;
    }
    let map = this._eventHandlers.get(type);
    if (!map) {
      map = new Map<EListener[keyof EListener], EConfig>();
      this._eventHandlers.set(type, map);
    }
    map.set(handler, config);
  }

  // 移除事件监听函数
  protected removeListener<T extends keyof EListener>(
    type: T,
    handler: EListener[T],
  ): void {
    const map = this._eventHandlers.get(type);
    if (map) {
      map.delete(handler);
      if (map.size === 0) {
        this._eventHandlers.delete(type);
      }
    }
  }

  /**
   * 默认的事件触发函数
   * @param type  要触发的事件类型
   * @param args  事件参数
   * @protected
   */
  protected dispatch<T extends keyof EListener>(
    type: T,
    ...args: Parameters<EListener[T]>
  ): void {
    const map = this._eventHandlers.get(type);
    if (!map) {
      return;
    }
    for (const keyValue of map) {
      keyValue[0](...args);
    }
  }

  /**
   * 事件名称的迭代器
   */
  protected eventIterator() {
    return this._eventHandlers.keys();
  }

  /**
   * 单个事件的listener迭代器
   * @param type 事件类型
   */
  protected listenerIterator<T extends keyof EListener>(type: T) {
    const map = this._eventHandlers.get(type);
    if (map) {
      return map.entries();
    }
    return (function* () {})() as IterableIterator<
      [EListener[keyof EListener], EConfig]
    >;
  }

  protected destroy() {
    this._eventHandlers.clear();
    this.isDestroy = true;
  }
}

// 监听函数的配置参数
export interface ListenerConfig {
  // 是否只触发一次
  once: boolean;
}

/**
 * 自定义事件系统，继承使用, 或者直接实例化使用
 */
export class EventEmitter<
  EListener extends { [K in keyof EListener]: (...args: any[]) => any },
> extends BaseEventEmitter<EListener, ListenerConfig> {
  readonly effective: boolean = true;

  readonly isDestroy: boolean = false;

  // 添加事件监听函数
  addListener<T extends keyof EListener>(
    type: T,
    handler: EListener[T],
    config?: ListenerConfig,
  ) {
    super.addListener(type, handler, config || { once: false });
  }

  // 移除事件监听函数
  removeListener<T extends keyof EListener>(type: T, handler: EListener[T]) {
    super.removeListener(type, handler);
  }

  // 以hook的形式注册监听函数
  useListener<T extends keyof EListener>(type: T, handler: EListener[T]) {
    const ref = useRef<EListener[T]>(handler);
    ref.current = handler;
    useEffect(() => {
      if (!this.effective) {
        console.warn('EventEmitter is not a effective Emitter');
        return undefined;
      }
      const _handler = (...args: any[]) => ref.current(...args);
      this.addListener(type, _handler as EListener[T]);
      return () => this.removeListener(type, _handler as EListener[T]);
    }, [type]);
  }

  // 触发某个事件(最简单的, 经典的事件触发函数)
  dispatch<T extends keyof EListener>(
    type: T,
    ...args: Parameters<EListener[T]>
  ): void {
    const map = this._eventHandlers.get(type);
    if (!map) {
      return;
    }
    for (const keyValue of map) {
      this.callListener(type, map, keyValue, args);
    }
  }

  // 不堵塞当前主流程,放到Promise里面去异步触发事件
  asyncDispatch<T extends keyof EListener>(
    type: T,
    ...args: Parameters<EListener[T]>
  ): Promise<void> {
    return Promise.resolve().then(() => this.dispatch(type, ...args));
  }

  // (同步)触发某个事件(如果监听函数中有异步函数,则会堵塞事件的触发过程)
  async syncDispatch<T extends keyof EListener>(
    type: T,
    ...args: Parameters<EListener[T]>
  ): Promise<void> {
    const map = this._eventHandlers.get(type);
    if (map) {
      // 事件派发
      let _return: any;
      for (const keyValue of map) {
        _return = this.callListener(type, map, keyValue, args);
        if (_return instanceof Promise) {
          await _return;
        }
      }
    }
  }

  // 触发某个事件, 并收集所有listener的返回值(如果返回的Promise会使用await)
  async collectDispatch<T extends keyof EListener>(
    type: T,
    ...args: Parameters<EListener[T]>
  ): Promise<ReturnType<EListener[T]>[]> {
    const map = this._eventHandlers.get(type);
    const returns: ReturnType<EListener[T]>[] = [];
    if (map) {
      // 事件派发
      let _return: any;
      for (const keyValue of map) {
        _return = this.callListener(type, map, keyValue, args);
        if (_return instanceof Promise) {
          _return = await _return;
        }
        returns.push(_return);
      }
    }
    return returns;
  }

  /**
   * 类似Array.every的某个触发事件, 触发事件的过程中会检查每个listener的返回值
   * 1. 如果某个listener的返回值不是 true/Promise<true>, 那么就立刻中断触发流程, 并返回Promise<false>;
   * 2. 如果所有的listener都返回 true/Promise<true>, 那么最终就会返回 Promise<true>;
   */
  async everyDispatch<T extends keyof EListener>(
    type: T,
    ...args: Parameters<EListener[T]>
  ): Promise<boolean> {
    const map = this._eventHandlers.get(type);
    if (map) {
      // 事件派发
      let _return: any;
      for (const keyValue of map) {
        _return = this.callListener(type, map, keyValue, args);
        if (_return instanceof Promise) {
          _return = await _return;
        }
        if (_return === false) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * 与everyDispatch不同的地方在于, listener的返回值不是 true/Promise<true>虽然也会导致最终的返回值为Promise<false>, 但是它不会中断触发流程, 所有listener都会被调用
   */
  async everyDispatch_All<T extends keyof EListener>(
    type: T,
    ...args: Parameters<EListener[T]>
  ): Promise<boolean> {
    const map = this._eventHandlers.get(type);
    if (map) {
      // 事件派发
      let _return: any;
      let _result = true;
      for (const keyValue of map) {
        _return = this.callListener(type, map, keyValue, args);
        if (_return instanceof Promise) {
          _return = await _return;
        }
        if (_return === false) {
          _result = false;
        }
      }
      return _result;
    }
    return true;
  }

  /**
   * 类似Array.some的某个触发事件, 触发事件的过程中会检查每个listener的返回值
   * 1. 如果某个listener的返回值是 true/Promise<true>, 那么就立刻中断触发流程, 并返回Promise<true>;
   * 2. 如果所有的listener的返回值都不是 true/Promise<true>, 那么最终就会返回 Promise<false>;
   */
  async someDispatch<T extends keyof EListener>(
    type: T,
    ...args: Parameters<EListener[T]>
  ): Promise<boolean> {
    const map = this._eventHandlers.get(type);
    if (map) {
      // 事件派发
      let _return: any;
      for (const keyValue of map) {
        _return = this.callListener(type, map, keyValue, args);
        if (_return instanceof Promise) {
          _return = await _return;
        }
        if (_return === true) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * 类似Array.reduce的某个触发事件, 上一个listener的返回值会作为下一个listener的输入
   */
  async reduceDispatch<T extends keyof EListener, V>(type: T, initValue: V) {
    const map = this._eventHandlers.get(type);
    let reduceValue: any = initValue;
    if (map) {
      // 事件派发
      for (const keyValue of map) {
        // @ts-ignore
        reduceValue = this.callListener(type, map, keyValue, [reduceValue]);
        if (reduceValue instanceof Promise) {
          reduceValue = await reduceValue;
        }
      }
    }
    return reduceValue as V;
  }

  // 分发事件, 调用listener
  protected callListener<T extends keyof EListener>(
    type: T,
    map: Map<EListener[T], ListenerConfig>,
    [listener, config]: [EListener[T], ListenerConfig],
    args: Parameters<EListener[T]>,
  ): ReturnType<EListener[T]> | undefined {
    // 如果只需要执行一次, 则从map移除该监听函数
    if (config.once) {
      map.delete(listener);
      // 移除不再需要的map集合
      if (map.size === 0) {
        this._eventHandlers.delete(type);
      }
    }
    return listener(...args);
  }
}

export function useEventEmitter<
  EListener extends { [K in keyof EListener]: (...args: any[]) => any },
>(eventEmitter?: EventEmitter<EListener>) {
  return useMemo(() => {
    if (eventEmitter instanceof EventEmitter) {
      return eventEmitter;
    }
    return new EventEmitter<EListener>();
  }, [eventEmitter]);
}
