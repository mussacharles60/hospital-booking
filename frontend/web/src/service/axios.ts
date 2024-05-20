import { APIResponse, AuthResponseData } from '../models';
import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { useEffect, useReducer } from 'react';

import Console from '../utils/console';
import axiosGeneral from 'axios';
import moment from 'moment';
import useAuth from '../contexts/auth';

const host = 'http://localhost:5000';

export const defaultHeaders = {
  'Content-Type': 'application/json',
};

export default axiosGeneral.create({
  baseURL: host,
  headers: defaultHeaders,
});

export const axiosPrivate = axiosGeneral.create({
  baseURL: host,
  headers: defaultHeaders,
  withCredentials: true,
});

interface AxiosConfig extends InternalAxiosRequestConfig<any> {
  sent?: boolean;
}

// used to get new access token from server, by using the refresh token from cookies
const useRefreshToken = () => {
  const [_, forceUpdate] = useReducer((x) => x + 1, 0);
  const { setAuth } = useAuth();

  const refresh = async () => {
    try {
      const res: AxiosResponse<APIResponse<AuthResponseData>> =
        await axiosGeneral.post(
          '/api/auth?t=' + moment().valueOf(),
          JSON.stringify({ action: 'get_access_token' }),
          {
            headers: {
              'Content-Type': 'application/json',
            },
            withCredentials: true,
          }
        );

      if (!res || !res.data) {
        // probably offline
        setAuth(null);
        forceUpdate();
        return null;
      }
      const error = res.data.error ? res.data.error : null;
      if (error) {
        // probably unauthorized
        setAuth(null); // log out
        return null;
      }
      setAuth({
        access_token: res.data?.success?.data?.access_token || null,
        user:
          res.data?.success?.data?.admin ||
          res.data.success?.data?.doctor ||
          res.data.success?.data?.patient ||
          null,
      });
      return res.data?.success?.data?.access_token || null;
    } catch (error: any) {
      const err: AxiosError<APIResponse> = error;
      Console.error('[useRefreshToken]: refresh: catch:', err.response);
      if (err.response && err.response.data && err.response.data.error) {
        // probably unauthorized
        setAuth(null); // log out
        forceUpdate();
        return null;
      } else {
        setAuth(null); // log out
        forceUpdate();
        return null;
      }
    }
  };

  return refresh;
};

// used to intercept all incoming and ongoing requests from client to server
export const useAxiosPrivate = () => {
  const refresh = useRefreshToken();
  const { auth, setAuth } = useAuth();

  useEffect(() => {
    const requestIntercept = axiosPrivate.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        config.withCredentials = true;
        if (config && config.headers) {
          if (!config.headers['Authorization']) {
            config.headers['Authorization'] = `Bearer ${auth?.access_token}`;
          }
          // Check if the payload is a form or a JSON string
          if (config.data instanceof FormData) {
            // If it's a form, set Content-Type to 'multipart/form-data'
            config.headers['Content-Type'] = 'multipart/form-data';
          } else if (
            typeof config.data === 'string' &&
            config.data.startsWith('{')
          ) {
            // If it's a JSON string, set Content-Type to 'application/json'
            config.headers['Content-Type'] = 'application/json';
          }
        }
        return config;
      },
      (error: AxiosError<APIResponse>) => {
        // Console.error('[auth]: useAxiosPrivate: requestIntercept: error', error.message);
        Promise.reject(error);
      }
    );

    const responseIntercept = axiosPrivate.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<APIResponse>) => {
        const prevRequest = error?.config as AxiosConfig;
        // Console.error(
        //   '[auth]: useAxiosPrivate: responseIntercept: error.toJSON',
        //   error?.toJSON()
        // );
        if (
          error &&
          error.response &&
          error.response.data &&
          error.response.data.error &&
          error.response.data.error.code &&
          (error.response.data.error.code === 401 ||
            error.response.data.error.code === 403) &&
          error.response.data.error.reason &&
          (error.response.data.error.reason === 'invalid_token' ||
            error.response.data.error.reason === 'token_expired')
        ) {
          // unauthorized
          if (!prevRequest?.sent) {
            Console.error(
              '[auth]: useAxiosPrivate: responseIntercept: prevRequest: not resent'
            );
            prevRequest.sent = true;
            return await resendRequest(prevRequest, error);
          }
          Console.error(
            '[auth]: useAxiosPrivate: responseIntercept: prevRequest: already resent: logout user now'
          );
          setAuth(null); // log out
          return Promise.reject(error);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axiosPrivate.interceptors.request.eject(requestIntercept);
      axiosPrivate.interceptors.response.eject(responseIntercept);
    };
  }, [auth, refresh]);

  const resendRequest = async (prevRequest: AxiosConfig, error: AxiosError) => {
    try {
      Console.debug(
        '[auth]: useAxiosPrivate: resendRequest: await new access token'
      );
      const newAccessToken = await refresh();
      Console.debug(
        '[auth]: useAxiosPrivate: resendRequest: await newAccessToken',
        newAccessToken
      );
      if (!newAccessToken) {
        return Promise.reject(error);
      }
      (prevRequest as any).headers[
        'Authorization'
      ] = `Bearer ${newAccessToken}`;
    } catch (error) {
      Console.error('[auth]: useAxiosPrivate: resendRequest: catch', error);
      return Promise.reject(error);
    }
    return axiosPrivate(prevRequest);
  };

  return axiosPrivate;
};
