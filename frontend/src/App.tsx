import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import jaJP from 'antd/locale/ja_JP';
import { QueryClient, QueryClientProvider } from 'react-query';

import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cases from './pages/Cases';
import Carriers from './pages/Carriers';
import Photos from './pages/Photos';
import GPS from './pages/GPS';
import Auction from './pages/Auction';
import JWNET from './pages/JWNET';
import Audit from './pages/Audit';

import './App.css';

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={jaJP}>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="cases" element={<Cases />} />
                <Route path="carriers" element={<Carriers />} />
                <Route path="photos" element={<Photos />} />
                <Route path="gps" element={<GPS />} />
                <Route path="auction" element={<Auction />} />
                <Route path="jwnet" element={<JWNET />} />
                <Route path="audit" element={<Audit />} />
              </Route>
            </Routes>
          </div>
        </Router>
      </ConfigProvider>
    </QueryClientProvider>
  );
};

export default App;
