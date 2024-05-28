import './index.scss';

import { useEffect, useRef, useState } from 'react';

import { APIErrorResponse } from '../../../../models';
import APIs from '../../../../service/APIHelper';
import useAuthContext from '../../../../contexts/auth';
import { useNavigate } from 'react-router-dom';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AdminSignInPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const authContext = useAuthContext();

  const root = useRef<HTMLDivElement>(null);
  const [isOverflowed, setIsOverflowed] = useState(false);

  useEffect(() => {
    if (
      authContext.auth &&
      authContext.auth.access_token &&
      authContext.auth.user
    ) {
      navigate('/home', { replace: true });
    }
    const resizeObserver = new ResizeObserver(() => {
      checkOverflow();
    });

    if (root.current) {
      resizeObserver.observe(root.current);
      // Listen for scroll event on the parent container
      root.current.addEventListener('scroll', checkOverflow);
      checkOverflow();
    }
    return () => {
      if (root.current) {
        resizeObserver.unobserve(root.current);
        root.current.removeEventListener('scroll', () => {});
      }
    };
  }, []);

  const checkOverflow = () => {
    if (root.current) {
      const isOverflowed =
        root.current.scrollWidth > root.current.clientWidth ||
        root.current.scrollHeight > root.current.clientHeight;
      setIsOverflowed(isOverflowed);
    }
  };

  const onSubmit = (event: any) => {
    event.preventDefault();
    if (email.length === 0 || !EMAIL_REGEX.test(email)) {
      setError(['Please enter a valid email address']);
      return;
    }
    if (password.length < 6) {
      setError(['Password should have atleast 6 characters']);
      return;
    }

    setError([]);

    // setIsLoading(true);
    // setTimeout(() => {
    //   setIsLoading(false);
    // }, 3000);

    // if (1 == 1) return;

    setIsLoading(true);
    APIs.getInstance()
      .auth()
      .userLogin('admin', email, password)
      .then((data) => {
        setIsLoading(false);
        if (data.admin) {
          authContext.setAuth({
            access_token: data.access_token,
            user: data.admin,
            user_type: 'admin',
          });
          // redirect to home page / dashboard
          navigate('/home');
        } else {
          setError(['Could not get user data!', 'Please try again']);
        }
      })
      .catch((error: APIErrorResponse) => {
        setIsLoading(false);
        setError([
          'An error ocurred while signing in!',
          error.message || '',
          'Please try again',
        ]);
      });
  };

  return (
    <div
      ref={root}
      className='auth-lay'
      style={{
        justifyContent: isOverflowed ? 'flex-start' : 'center',
      }}
    >
      <div className='auth-bg-lay'>
        <div className='auth-bg-top' />
        <img
          className='auth-bg-image'
          src={require('../../../../assets/images/hero.jpg')}
        />
      </div>
      <form onSubmit={onSubmit} className='auth-form-lay'>
        <span className='auth-form-title'>Admin Sign In</span>
        {!isLoading && (
          <>
            <input
              type='email'
              className='auth-form-input'
              value={email}
              placeholder='enter your email address'
              onChange={(e) => {
                setEmail(e.currentTarget.value);
                setError([]);
              }}
            />
            <input
              type='password'
              className='auth-form-input'
              value={password}
              placeholder='enter your password'
              onChange={(e) => {
                setPassword(e.currentTarget.value);
                setError([]);
              }}
            />
            <button type='submit' className='auth-form-button'>
              Sign In
            </button>
          </>
        )}
        {isLoading && (
          <div className='loading-lay'>
            <div className='loading-spinner' />
            <span className='loading-text'>Signing In, Please wait ...</span>
          </div>
        )}
        {error.length > 0 && (
          <div className='auth-form-error-lay'>
            {error.map((err) => (
              <span className='auth-form-error-text'>{err}</span>
            ))}
          </div>
        )}
      </form>
    </div>
  );
};

export default AdminSignInPage;
