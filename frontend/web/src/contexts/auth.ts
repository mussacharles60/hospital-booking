import { AuthContextType, AuthUser } from '../models';
import { createContext, useContext, useDebugValue, useState } from 'react';

export const AuthContext = createContext<AuthContextType>({
  auth: null,
  setAuth: () => {},
});

export const useAuthProvider = () => {
  const [auth, setAuth] = useState<AuthUser | null>(null);

  return {
    auth,
    setAuth: (a: AuthUser | null) => {
      setAuth(a);
    },
  };
};

const useAuth = () => {
  const { auth } = useContext(AuthContext);
  useDebugValue(auth, (auth) => (auth?.user ? 'Logged In' : 'Logged Out'));
  return useContext(AuthContext);
};

export default useAuth;
