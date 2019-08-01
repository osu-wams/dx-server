import supertest from 'supertest';
import nock from 'nock';
import config from 'config';
import app from '../../index';
import { alertClear, alertPresent } from '../__mocks__/alerts.data';

const BASE_URL = config.get('raveApi.baseUrl');
const request = supertest.agent(app);

describe('/alerts', () => {
  it('should return an alert when one is present', async () => {
    const data = [
      {
        date: '2018-05-29T18:47:39Z',
        title: 'Weather closure 10/12',
        link: '',
        pubDate: 'Tue, 10 Dec 2018 18:47:39 GMT',
        'dc:date': '2018-05-29T18:47:39Z',
        content: 'Snow causes dangerous road conditions',
        contentSnippet: 'Snow causes dangerous road conditions',
        guid: '',
        isoDate: '2018-12-10T18:47:39.000Z'
      }
    ];

    // Mock response from Handshake - query parameters must be an exact match
    nock(BASE_URL)
      .get('')
      .reply(200, alertPresent.xml, { 'Content-Type': 'application/xml' });

    await request.get('/api/alerts').expect(200, data);
  });

  it('should return an empty array [] when "All Clear" is present in the data', async () => {
    // Mock response from Handshake - query parameters must be an exact match
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
