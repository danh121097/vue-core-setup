import { boot } from 'quasar/wrappers';
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosRequestHeaders,
  AxiosResponse,
} from 'axios';
import { createHmac } from 'crypto';
import { IAPIResponseError } from '@types';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
  }
}

enum ContentType {
  'application/json' = 'application/json',
}

interface AdaptAxiosRequestConfig extends AxiosRequestConfig {
  headers: AxiosRequestHeaders;
}

interface AxiosConfigHeaders {
  'Content-Type': ContentType;
  ctime?: number;
  sig?: string;
  authorization?: string;
}

const api = axios.create({
  baseURL: process.env.ENDPOINT,
  withCredentials: true,
});

function deleteEmptyValue(data: Record<string, unknown>) {
  Object.keys(data).map((k) => {
    data[k] = void 0 && delete data[k];
  });
  return data;
}

function generateHMACsignature(
  config: AxiosRequestConfig,
  HMAC_SECRET: string
) {
  const headers: AxiosConfigHeaders = {
    'Content-Type': ContentType['application/json'],
    ctime: +new Date(),
  };
  let path = config.url || '';
  if (!path.startsWith('/')) path = '/' + path;
  const stringToSign = `${config.method?.toUpperCase() || ''}
${headers['Content-Type']}
${headers['ctime'] || ''}
${path}
`;
  headers.sig = createHmac('sha256', HMAC_SECRET)
    .update(stringToSign)
    .digest('base64');
  return headers;
}

api.interceptors.request.use(
  function (config: AdaptAxiosRequestConfig) {
    const token = localStorage.getItem(`${process.env.APP_NAME}_token`);
    const HMAC_SECRET = process.env.HMAC_SECRET || '';
    config.headers = {
      ...config.headers,
      ...generateHMACsignature(config, HMAC_SECRET),
    } as AxiosRequestHeaders;
    if (token) {
      (
        config.headers as AxiosConfigHeaders
      ).authorization = `Bearer ${token.toString()}`;
    }
    config.data &&
      (config.data =
        deleteEmptyValue(config.data as Record<string, unknown>) || undefined);
    config.params &&
      (config.params =
        deleteEmptyValue(config.params as Record<string, unknown>) ||
        undefined);
    return config;
  },
  function (error: AxiosError) {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response: AxiosResponse) => {
    if (response.data.status === 'success') return response.data;

    if (response.data.error_code === 401) {
      localStorage.removeItem(`${process.env.APP_NAME}_token`);
      location.reload();
    }
    return Promise.reject<IAPIResponseError>(
      response.data || { data: undefined }
    );
  },
  async (error: AxiosError<IAPIResponseError>) => {
    return Promise.reject(error.response?.data || 'Network Error');
  }
);

export default boot(({ app }) => {
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;
});

export { api };
