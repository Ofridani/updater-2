import React from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider
      theme={{
        primaryColor: 'teal',
        fontFamily: '"Instrument Sans", "Segoe UI", sans-serif',
        headings: {
          fontFamily: '"Manrope", "Instrument Sans", "Segoe UI", sans-serif'
        }
      }}
    >
      <App />
    </MantineProvider>
  </React.StrictMode>
);
