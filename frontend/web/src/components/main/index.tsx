import './index.scss';

import { Link, useNavigate } from 'react-router-dom';

import APIs from '../../service/APIHelper';
import { FaUserCircle } from 'react-icons/fa';
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
    <div className='main-lay'>
      {/* <span>Main Page</span>
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
      )} */}
      <div className='main-side-nav'></div>
      <div className='main-wrapper'>
        <div className='main-top-bar'>
          <div className='main-top-bar-left-lay'></div>
          <div className='main-top-bar-right-lay'>
            {authContext.auth && authContext.auth.user && (
              <Link to={'/account'} className='account-lay'>
                <FaUserCircle className='account-ic-lay' />
                <span>{authContext.auth.user.name}</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainPage;
