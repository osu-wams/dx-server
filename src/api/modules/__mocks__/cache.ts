/* eslint-disable no-unused-vars */

import { RequestPromiseOptions } from 'request-promise';
import cache, { CacheOptions, SetCacheOptions } from '../cache';

export const mockCacheUrl = 'http://key';
const mockCachedData = { 'http://key': '{"key":"value"}' };

export const getAsync = jest.fn().mockImplementation((key: string) => {
  return new Promise((resolve, reject) => {
    process.nextTick(() => {
      if (mockCachedData) resolve(mockCachedData);
      else reject(new Error('happy little accident'));
    });
  });
});

export const setAsync = jest
  .fn()
  .mockImplementation((key: string, data: string, options: SetCacheOptions) => {
    return new Promise((resolve, reject) => {
      process.nextTick(() => {
        if (mockCachedData) resolve(mockCachedData);
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

export default { setAsync, getAsync };
