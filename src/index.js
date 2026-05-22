import Spinner from './components/Spinner';

import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import logofarevet from './components/assets/svg/farevetlogo.svg';
import './index.css';
import reportWebVitals from './reportWebVitals';
import { SocketProvider } from './socket/socketProvider';
import { store } from './redux/store';
import { Provider } from 'react-redux';
const App = lazy(() => import('./App'))

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Suspense fallback={
    <main className='h-screen flex flex-col justify-center items-center'>
      <Spinner size={60} color="#8930f9" />
      <img src={logofarevet} className='w-[2rem] absolute' alt="" />
    </main>
  }>
    <React.StrictMode>
      <Provider store={store}>
        <HashRouter>
          <SocketProvider>
            <App />
          </SocketProvider>
        </HashRouter>
      </Provider>
    </React.StrictMode>
  </Suspense>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();