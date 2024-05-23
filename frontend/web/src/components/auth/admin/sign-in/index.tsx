import './index.scss';

import { useEffect, useRef, useState } from 'react';

import APIs from '../../../../service/APIHelper';
import useAuthContext from '../../../../contexts/auth';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AdminSignInPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const authContext = useAuthContext();

  const root = useRef<HTMLDivElement>(null);
  const [isOverflowed, setIsOverflowed] = useState(false);

  useEffect(() => {
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
      setError('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setError('Password should have atleast 6 characters');
      return;
    }

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
          });
        } else {
          setError('Could not get user data!');
        }
      })
      .catch((error) => {
        setIsLoading(false);
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
      <form onSubmit={onSubmit} className='auth-form-lay'>
        <span className='auth-form-title'>Admin Sign In</span>
        <input
          type='email'
          className='auth-form-input'
          value={email}
          placeholder='enter your email address'
          onChange={(e) => {
            setEmail(e.currentTarget.value);
          }}
        />
        <input
          type='password'
          className='auth-form-input'
          value={password}
          placeholder='enter your password'
          onChange={(e) => {
            setPassword(e.currentTarget.value);
          }}
        />
        <button type='submit' className='auth-form-button'>
          Sign In
        </button>
        {error.length > 0 && (
          <span className='auth-form-error-text'>{error}</span>
        )}
      </form>
    </div>
  );
};

export default AdminSignInPage;
