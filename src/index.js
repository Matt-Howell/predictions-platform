import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ChakraProvider theme={extendTheme({
    styles: {
      global: () => ({
        body: {
          bg:'#fcfcfc',
          color:'#4A5568'
        },
        html: {
          colorScheme:'light'
        }
      }),
    },
  })}>
    <App />
  </ChakraProvider>
);