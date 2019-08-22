import supertest from 'supertest';
import nock from 'nock';
import config from 'config';
import app from '../../index';
import { alertClear, alertPresent, dxAlert } from '../__mocks__/alerts.data';

const BASE_URL = config.get('raveApi.baseUrl');
const DX_BASE_URL = config.get('dxApi.baseUrl');
const request = supertest.agent(app);

describe('/alerts', () => {
  it('should return an alert when one is present', async () => {
    const data = [
      {
        date: '2018-05-29T18:47:39Z',
        title: 'Weather closure 10/12',
        content: 'Snow causes dangerous road conditions',
        type: 'rave'
      }
    ];

    nock(BASE_URL)
      .get('')
      .reply(200, alertPresent.xml, { 'Content-Type': 'application/xml' });

    await request.get('/api/alerts').expect(200, data);
  });

  it('should return an empty array [] when "All Clear" is present in the data', async () => {
    nock(BASE_URL)
      .get('')
      .reply(200, alertClear.xml, { 'Content-Type': 'application/xml' });

    await request.get('/api/alerts').expect(200, alertClear.response);
  });

  it('should return "Unable to retrieve alerts." when there is a 500 error', async () => {
    nock(BASE_URL)
      .get('')
      .reply(500);

    await request
      .get('/api/alerts')
      .expect(500)
      .expect(r => r.error.text === 'Unable to retrieve alerts.');
  });
});

describe('/alerts/dx', () => {
  it('should return alerts when present', async () => {
    // ! TODO: Replace with DX API url to mock
    // nock(DX_BASE_URL)
    //   .get('')
    //   .reply(200, dxAlert, { 'Content-Type': 'application/json' });

    await request.get('/api/alerts/dx').expect(200, dxAlert);
  });

  xit('should return an empty array [] when no alerts are present', async () => {
    // ! TODO: Replace with DX API url to mock
    nock(DX_BASE_URL)
      .get('')
      .reply(200, dxAlert, { 'Content-Type': 'application/json' });

    await request.get('/api/alerts/dx').expect(200, []);
  });

  xit('should return "Unable to retrieve alerts." when there is a 500 error', async () => {
    // ! TODO: Replace with DX API url to mock
    nock(DX_BASE_URL)
      .get('')
      .reply(500);

    await request
      .get('/api/alerts/dx')
      .expect(500)
      .expect(r => r.error.text === 'Unable to retrieve alerts.');
  });
});
