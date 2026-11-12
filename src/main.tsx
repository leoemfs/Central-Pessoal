import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { DataProvider } from './store';
import { ErrorBoundary } from './ErrorScreen';
import './styles.css';
import { startNavigation } from './router';

// Voltar que sobe um nível (E20): precisa estar ligado antes da primeira tela.
startNavigation();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary scope="app">
      <DataProvider>
        <App />
      </DataProvider>
    </ErrorBoundary>
  </StrictMode>,
);

// Permite usar offline e instalar como app (PWA) — apenas no build de produção.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* sem suporte ou contexto inseguro: o app funciona normalmente */
    });
  });
}
