import { BrowserRouter, Route, Routes } from 'react-router-dom';

import LadingPage from './components/landing';
import MainPage from './components/main';

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
