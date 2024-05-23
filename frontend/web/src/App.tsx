import { AuthContext, useAuthProvider } from './contexts/auth';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import AdminSignInPage from './components/auth/admin/sign-in';
import LadingPage from './components/landing';
import MainPage from './components/main';

const App = () => {
  const auth = useAuthProvider();

  return (
    <AuthContext.Provider value={auth}>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<LadingPage />} />
          <Route path='/admin/sign-in' element={<AdminSignInPage />} />
          {/* <Route path='/admin/forgot-password' element={<AdminSignInPage />} /> */}
          <Route path='/home' element={<MainPage />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
};

export default App;
