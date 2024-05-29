import './index.scss';

import {
  FaBars,
  FaBuilding,
  FaHome,
  FaUserCircle,
  FaUsers,
} from 'react-icons/fa';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

import APIs from '../../service/APIHelper';
import { GiExitDoor } from 'react-icons/gi';
import { HiUsers } from 'react-icons/hi';
import useAuthContext from '../../contexts/auth';
import { useAxiosPrivate } from '../../service/axios';

const MainPage = () => {
  const navigate = useNavigate();
  const authContext = useAuthContext();

  const axiosInstance = useAxiosPrivate();

  const [showSideNav, setShowSideNav] = useState(false);

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

  const onSignOutClick = () => {
    APIs.getInstance()
      .auth()
      .sighOut(axiosInstance)
      .then(() => {
        authContext.setAuth(null);
        setTimeout(() => navigate('/'), 500);
      })
      .catch(() => {});
  };

  return (
    <div className='main-lay'>
      <SideNav
        showSideNav={showSideNav}
        setShowSideNav={(show) => setShowSideNav(show)}
        onSignOutClick={onSignOutClick}
      />
      <div className='main-wrapper'>
        {showSideNav && (
          <div
            className='main-wrapper-top'
            onClick={() => setShowSideNav(false)}
          />
        )}
        <div className='main-top-bar'>
          <div className='main-top-bar-left-lay'>
            <FaBars
              className='main-top-bar-left-menu-btn'
              onClick={() => setShowSideNav(true)}
            />
          </div>
          <div className='main-top-bar-right-lay'>
            {authContext.auth && authContext.auth.user && (
              <Link to={'/account'} className='account-lay'>
                <FaUserCircle className='account-lay-ic' />
                <span className='account-lay-text'>
                  {authContext.auth.user.name}
                </span>
              </Link>
            )}
          </div>
        </div>
        <div className='main-app-lay'></div>
      </div>
    </div>
  );
};

export default MainPage;

type SideNavProps = {
  showSideNav: boolean;
  setShowSideNav: (show: boolean) => void;
  onSignOutClick: () => void;
};

const SideNav = (props: SideNavProps) => {
  const location = useLocation();
  const authContext = useAuthContext();

  return (
    <div
      className={`main-side-nav${
        props.showSideNav ? ' main-side-nav-act' : ''
      }`}
    >
      <div className='main-side-nav-header'>
        <span className='side-nav-header-text'>TopDoc</span>
      </div>
      <div className='main-side-nav-body'>
        <Link
          to={'/home'}
          className={`side-nav-btn${
            location.pathname.startsWith('/home') ? ' als-act' : ''
          }`}
          onClick={() => props.setShowSideNav(false)}
        >
          <FaHome className='side-nav-btn-ic' />
          <span className='side-nav-btn-text'>Dashboard</span>
        </Link>
        {authContext.auth &&
          authContext.auth.user_type &&
          authContext.auth.user_type === 'admin' && (
            <>
              <Link
                to={'/departments'}
                className={`side-nav-btn${
                  location.pathname.startsWith('/departments') ? ' als-act' : ''
                }`}
                onClick={() => props.setShowSideNav(false)}
              >
                <FaBuilding className='side-nav-btn-ic' />
                <span className='side-nav-btn-text'>Departments</span>
              </Link>
              <Link
                to={'/doctors'}
                className={`side-nav-btn${
                  location.pathname.startsWith('/doctors') ? ' als-act' : ''
                }`}
                onClick={() => props.setShowSideNav(false)}
              >
                <HiUsers className='side-nav-btn-ic' />
                <span className='side-nav-btn-text'>Doctors</span>
              </Link>
              <Link
                to={'/patients'}
                className={`side-nav-btn${
                  location.pathname.startsWith('/patients') ? ' als-act' : ''
                }`}
                onClick={() => props.setShowSideNav(false)}
              >
                <FaUsers className='side-nav-btn-ic' />
                <span className='side-nav-btn-text'>Patients</span>
              </Link>
            </>
          )}
        <Link
          to={'/account'}
          className={`side-nav-btn${
            location.pathname.startsWith('/account') ? ' als-act' : ''
          }`}
          onClick={() => props.setShowSideNav(false)}
        >
          <FaUserCircle className='side-nav-btn-ic' />
          <span className='side-nav-btn-text'>Account</span>
        </Link>
      </div>
      <div className='main-side-nav-footer'>
        <button className='sign-out-btn' onClick={props.onSignOutClick}>
          <GiExitDoor className='sign-out-btn-ic' />
          <span className='sign-out-btn-text'>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
