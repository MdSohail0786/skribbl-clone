import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import { GameProvider } from './context/GameContext.jsx';
import './styles/index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SocketProvider>
        <GameProvider>
          <App />
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: '#131a2b',
                color: '#e8ebf5',
                border: '1px solid #263149',
              },
            }}
          />
        </GameProvider>
      </SocketProvider>
    </BrowserRouter>
  </StrictMode>
);
