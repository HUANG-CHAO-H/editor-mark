import { QueryCache, QueryClient } from 'react-query';

const queryCache = new QueryCache();
const queryClientSingleton = new QueryClient({
  queryCache,
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});
export default queryClientSingleton;

export { queryClientSingleton };
