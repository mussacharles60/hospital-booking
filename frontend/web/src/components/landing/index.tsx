import './index.scss';

import { Link, useNavigate } from 'react-router-dom';

import AppBar from '@mui/material/AppBar';
import Button from '@mui/material/Button';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useRef } from 'react';

const LadingPage = () => {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const onScroll = () => {
    if (rootRef.current) {
      // console.log(
      //   '[LandingPage]: onScroll: rootRef: top: ',
      //   rootRef.current.scrollTop
      // );
      if (rootRef.current.scrollTop === 0) {
        if (headerRef.current) {
          if (headerRef.current.classList.contains('header-with-shadow')) {
            headerRef.current.classList.remove('header-with-shadow');
          }
        }
      } else {
        if (headerRef.current) {
          if (!headerRef.current.classList.contains('header-with-shadow')) {
            headerRef.current.classList.add('header-with-shadow');
          }
        }
      }
    }
  };

  return (
    <div className='landing-page' ref={rootRef} onScroll={onScroll}>
      <div className='landing-page-header' ref={headerRef}>
        <span className='landing-page-header-text'>HOSPITAL BOOKING</span>
      </div>
      <div className='first-lay'>
        <div className='top-lay' />
        <img
          className='bg-image'
          src={require('../../assets/images/hero.jpg')}
        />
        <div className='left-lay'>
          <span className='title-text'>
            Your Health, Our Priority - Book Appointments with Ease
          </span>
        </div>
        <div className='right-lay'>
          <img
            className='hero-image'
            src={require('../../assets/images/hero.jpg')}
          />
        </div>
      </div>
      <div className='second-lay'>
        <Button
          variant='contained'
          className='link-btn'
          onClick={() => {
            navigate('/signup');
          }}
        >
          Register Now
        </Button>
        <Button
          variant='contained'
          className='link-btn'
          onClick={() => {
            navigate('/admin/sign-in');
          }}
        >
          Admin Sign In
        </Button>
      </div>
    </div>
  );
};

export default LadingPage;
