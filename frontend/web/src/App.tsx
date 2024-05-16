import './App.css';

import { BrowserRouter, Route, Routes } from 'react-router-dom';

import LadingPage from './components/landing';
import MainPage from './components/main';
import React from 'react';
import logo from './logo.svg';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<LadingPage />} />
        <Route path='/main' element={<MainPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
