import { Link, useNavigate } from 'react-router-dom';

import APIs from '../../service/APIHelper';
import useAuthContext from '../../contexts/auth';
import { useAxiosPrivate } from '../../service/axios';
import { useEffect } from 'react';

const MainPage = () => {
  const navigate = useNavigate();
  const authContext = useAuthContext();

  const axiosInstance = useAxiosPrivate();

  useEffect(() => {
    if (
      !authContext.auth ||
      !authContext.auth.access_token ||
      !authContext.auth.user
    ) {
      navigate('/');
    }
    return () => {};
  }, []);

  return (
    <div>
      <span>Main Page</span>
      {authContext.auth?.user && <span>{authContext.auth?.user?.name}</span>}
      <Link to='/'>Go to landing page</Link>
      {authContext.auth && (
        <button
          onClick={() => {
            APIs.getInstance()
              .auth()
              .sighOut(axiosInstance)
              .then(() => {
                navigate('/');
              })
              .catch(() => {});
          }}
        >
          Sign Out
        </button>
      )}
    </div>
  );
};

export default MainPage;
