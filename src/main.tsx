import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.less';

import { Home } from './pages/home';
import { FileContextProvider } from './context/FileContext.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FileContextProvider>
      <Home />
    </FileContextProvider>
  </React.StrictMode>,
)
