import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.less';

import { Home } from './pages/home';
import {EditorContextProvider} from './context/EditorContext.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <EditorContextProvider>
      <Home />
    </EditorContextProvider>
  </React.StrictMode>,
)
