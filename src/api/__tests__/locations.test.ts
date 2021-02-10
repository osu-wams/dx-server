import supertest from 'supertest';
import nock from 'nock';
import app from '../../index';
import * as locationsData from '../../mocks/osu/locations.data.json';
import cache from '../modules/cache'; // eslint-disable-line no-unused-vars
import { mockedGet, mockedGetResponse } from '../modules/__mocks__/cache';
import { OSU_API_BASE_URL } from '../../constants';

jest.mock('../util.ts', () => ({
  ...jest.requireActual('../util.ts'),
  getToken: () => Promise.resolve('bearer token'),
}));

const APIGEE_BASE_URL: string = `${OSU_API_BASE_URL}/v1`;
const request = supertest.agent(app);

describe('/api/locations', () => {
  describe('/', () => {
    it('should return location general information', async () => {
      mockedGetResponse.mockReturnValue(locationsData);
      cache.get = mockedGet;
      // Mock response from Apigee
      nock(APIGEE_BASE_URL)
        .get(/locations\/*/)
        .query(true)
        .reply(200, locationsData);

      const response = await request.get('/api/locations/cascade');
      expect(response.status).toEqual(200);

      expect(response.body).toStrictEqual([
        {
          id: '20eeddae11a47affc9a524052ba12955',
          name: 'Cascades Hall-COCC',
          link: null,
          image: null,
          description: null,
          descriptionHTML: null,
          address: '2600 NW COLLEGE WAY',
          city: 'BEND',
          state: 'OR',
          zip: '97703',
          campus: 'Cascades',
        },
        {
          id: 'c5e354b41718cec09640c9c9efed1880',
          name: 'OSU Cascades Residence Hall',
          link: null,
          image: null,
          description: null,
          descriptionHTML: null,
          address: '1500 CHANDLER AVENUE',
          city: 'BEND',
          state: 'OR',
          zip: '97701',
          campus: 'Cascades',
        },
        {
          id: '665e5039a9e92e7c47f52dd90e091899',
          name: 'Cascade Hall',
          link: 'https://map.oregonstate.edu/?id=665e5039a9e92e7c47f52dd90e091899',
          image:
            'https://map.oregonstate.edu/sites/map.oregonstate.edu/files/styles/thumbnail/public/locations/9.jpg',
          description:
            '\r\n\tAccessibility:\r\n\r\n\r\n\tENTRIES: Northwest entry to ceramics lab only.\r\n\tFLOORS: Ceramics lab (1st floor) only; 11/2 lip up to 1st on other.\r\n',
          descriptionHTML:
            '<h4>\n\tAccessibility:</h4>\n<p>\n\tENTRIES: Northwest entry to ceramics lab only.<br />\n\tFLOORS: Ceramics lab (1st floor) only; 11/2 lip up to 1st on other.</p>\n',
          address: '601 SW 17th Street',
          city: 'CORVALLIS',
          state: 'OR',
          zip: '97331',
          campus: 'Corvallis',
        },
      ]);
    });

    it('should return "Unable to retrieve location information." when there is a 500 error', async () => {
      mockedGetResponse.mockReturnValue(undefined);
      cache.get = mockedGet;
      nock(APIGEE_BASE_URL)
        .get(/locations\/*/)
        .reply(500);

      await request
        .get('/api/locations/cascade')
        .expect(500, { message: 'Unable to retrieve location information.' });
    });
  });
});
