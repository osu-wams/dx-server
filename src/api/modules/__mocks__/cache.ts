/* eslint-disable no-unused-vars */

import { RequestPromiseOptions } from 'request-promise';
import cache, { CacheOptions, SetCacheOptions } from '../cache';

export const mockCacheUrl = 'http://key';
export const mockCachedData: any = jest.fn(() => {
  return { 'http://key': '{"key":"value"}' };
});
export const mockFlushDbData = 'Ok';

export const getAsync = jest.fn().mockImplementation((key: string) => {
  return new Promise((resolve, reject) => {
    process.nextTick(() => {
      if (mockCachedData) resolve(mockCachedData());
      else reject(new Error('happy little accident'));
    });
  });
});

export const setAsync = jest
  .fn()
  .mockImplementation((key: string, data: string, options: SetCacheOptions) => {
    return new Promise((resolve, reject) => {
      process.nextTick(() => {
        if (mockCachedData) resolve(mockCachedData());
        else reject(new Error('happy little accident'));
      });
    });
  });

export const mockedGetResponse = jest.fn();
export const mockedGet = jest.fn().mockImplementation(
  (
    url: string,
    requestOptions: RequestPromiseOptions,
    performCache?: boolean,
    cacheOptions?: CacheOptions
  ): Promise<any> => {
    const response = mockedGetResponse();
    if (response) {
      if (response[url]) return Promise.resolve(response[url]);
      return Promise.resolve(response);
    }
    return Promise.resolve(undefined);
  }
);

export const flushDbAsync = jest.fn().mockImplementation(() => {
  return new Promise((resolve, reject) => {
    process.nextTick(() => {
      if (mockFlushDbData) resolve(mockFlushDbData);
      else reject(new Error('happy little accident'));
    });
  });
});

export const mockedFlushDbResponse = jest.fn();
export const mockedFlushDb = jest.fn().mockImplementation(
  (): Promise<boolean> => {
    return Promise.resolve(mockedFlushDbResponse());
  }
);

export default { setAsync, getAsync, flushDbAsync };
