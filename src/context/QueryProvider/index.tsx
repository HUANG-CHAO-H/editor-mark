import { ReactNode, createContext, useState, useMemo, useContext } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';

import { queryClientSingleton } from './queryClientSingleton';
export { queryClientSingleton };

export interface QueryProviderProps {
  // 是否显示调试工具（dev模式开发下有效）
  devTools?: boolean;
  // 是否开启共享上下文
  contextSharing?: boolean;
  // Query实例
  client?: QueryClient;
  // 孩子节点
  children?: ReactNode;
}

export interface IQueryContext {
  // query实例
  client: QueryClient;
  // 刷新整个组件树
  refresh: () => void;
}

export const QueryContext = createContext<IQueryContext>(
  new Proxy({} as IQueryContext, {
    get(_, p: string | symbol): any {
      throw new Error(`can not read ${String(p)} from global QueryContext`);
    },
  }),
);
export function useQueryContext() {
  return useContext(QueryContext);
}

export function QueryProvider(props: QueryProviderProps) {
  const { client = queryClientSingleton, devTools = false, contextSharing } = props;
  const [refresh, setRefresh] = useState(Number.MIN_SAFE_INTEGER);
  const contextValue = useMemo<IQueryContext>(
    () => ({
      client,
      refresh: () => setRefresh(v => v + 1),
    }),
    [client],
  );

  return (
    <QueryClientProvider client={client} key={refresh} contextSharing={contextSharing}>
      <QueryContext.Provider value={contextValue}>
        {props.children}
        {devTools && <DevTools />}
      </QueryContext.Provider>
    </QueryClientProvider>
  );
}

/**
 * 支持拖拽到任意位置的react-query调试工具
 */
function DevTools({ disabled = false }: { disabled?: boolean }) {
  const [pos, setPos] = useState<{
    left?: number | string;
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
  }>({ left: 'auto', right: 0, bottom: 0 });
  if (disabled) {
    return <></>;
  }
  return (
    <ReactQueryDevtools
      initialIsOpen={false}
      toggleButtonProps={{
        style: pos,
        onMouseDown: event => {
          const btn = event.currentTarget as HTMLButtonElement;
          const style = window.getComputedStyle(btn);
          const info = {
            pageX: event.pageX,
            pageY: event.pageY,
            offsetX:
              event.pageX - btn.offsetLeft + Number(style.marginLeft.replace(/[^0-9_.]/g, '')),
            offsetY: event.pageY - btn.offsetTop + Number(style.marginTop.replace(/[^0-9_.]/g, '')),
          };
          const onMousemove = (e: MouseEvent) => {
            e.stopPropagation(); // 阻止事件继续传播，减少性能损耗
            btn.style.left = e.pageX - info.offsetX + 'px';
            btn.style.top = e.pageY - info.offsetY + 'px';
          };
          const onMouseup = (e: MouseEvent) => {
            window.removeEventListener('mousemove', onMousemove);
            setPos({
              left: e.pageX - info.offsetX,
              top: e.pageY - info.offsetY,
            });
          };
          const onClick = (e: MouseEvent) => {
            if (Math.abs(info.pageX - e.pageX) > 5 || Math.abs(info.pageY - e.pageY) > 5) {
              e.stopPropagation();
            }
          };
          window.addEventListener('mousemove', onMousemove);
          window.addEventListener('mouseup', onMouseup, {
            capture: true,
            once: true,
          });
          btn.addEventListener('click', onClick, {
            capture: true,
            once: true,
          });
        },
      }}
    />
  );
}
