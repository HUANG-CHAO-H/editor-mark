import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.less';

import { Home } from './pages/home';
import {EditorContextProvider, QueryProvider} from './context';
import {WordTypeContextProvider} from "./context";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryProvider>
      <EditorContextProvider>
        <WordTypeContextProvider>
          <Home />
        </WordTypeContextProvider>
      </EditorContextProvider>
    </QueryProvider>
  </React.StrictMode>,
)
