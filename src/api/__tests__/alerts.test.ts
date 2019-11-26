import supertest from 'supertest';
import nock from 'nock';
import config from 'config';
import app from '../../index';
import { alertClear, alertPresent, dxAlert, dxAPIAlerts } from '../__mocks__/alerts.data';
import cache from '../modules/cache'; // eslint-disable-line no-unused-vars
import {
  mockedGetResponse,
  mockedGet,
  setAsync,
  getAsync,
  mockCachedData,
} from '../modules/__mocks__/cache';

const BASE_URL: string = config.get('raveApi.baseUrl');
const DX_BASE_URL: string = config.get('dxApi.baseUrl');
const request = supertest.agent(app);

describe('/alerts', () => {
  it('should return an alert when one is present', async () => {
    const data = [
      {
        date: '2018-05-29T18:47:39Z',
        title: 'Weather closure 10/12',
        content: 'Snow causes dangerous road conditions',
        type: 'rave',
      },
    ];
    mockedGetResponse.mockReturnValue(alertPresent.xml);
    cache.get = mockedGet;

    nock(BASE_URL)
      .get('')
      .reply(200, alertPresent.xml, { 'Content-Type': 'application/xml' });

    await request.get('/api/alerts').expect(200, data);
  });

  it('should return an empty array [] when "All Clear" is present in the data', async () => {
    mockedGetResponse.mockReturnValue(alertClear.xml);
    cache.get = mockedGet;
    nock(BASE_URL)
      .get('')
      .reply(200, alertClear.xml, { 'Content-Type': 'application/xml' });

    await request.get('/api/alerts').expect(200, alertClear.response);
  });

  it('should return "Unable to retrieve alerts." when there is a 500 error', async () => {
    mockedGetResponse.mockReturnValue(undefined);
    cache.get = mockedGet;
    nock(BASE_URL)
      .get('')
      .reply(500);

    await request.get('/api/alerts').expect(500, { message: 'Unable to retrieve rave alerts.' });
  });
});

describe('/alerts/dx', () => {
  it('should fetch cached data and return alerts when present', async () => {
    mockCachedData.mockReturnValue(JSON.stringify(dxAPIAlerts));
    cache.getAsync = getAsync;
    await request.get('/api/alerts/dx').expect(200, dxAlert);
  });

  it('should fetch uncached data and return an empty array [] when no alerts are present', async () => {
    mockCachedData.mockReturnValue(null);
    cache.getAsync = getAsync;
    cache.setAsync = setAsync;
    nock(DX_BASE_URL)
      .get('/jsonapi/node/alerts')
      .query(true)
      .reply(200, { data: [] }, { 'Content-Type': 'application/json' });

    await request.get('/api/alerts/dx').expect(200, []);
  });

  it('should return "Unable to retrieve alerts." when there is a 500 error', async () => {
    mockCachedData.mockReturnValue(null);
    cache.getAsync = getAsync;
    nock(DX_BASE_URL)
      .get('/jsonapi/node/alerts')
      .query(true)
      .reply(500);

    await request.get('/api/alerts/dx').expect(500, { message: 'Unable to retrieve dx alerts.' });
  });
});
