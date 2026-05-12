import React from 'react';
import ReactDOM from 'react-dom/client';
import './design-system/scss/global.scss';
import reportWebVitals from './reportWebVitals';
import { App } from 'Core/App';
import { AuthProvider } from 'contexts/AuthContext';

const root = document.getElementById("root")
if (!root) throw new Error("Root element not found")

ReactDOM.createRoot(root).render(

  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>

);

reportWebVitals();
