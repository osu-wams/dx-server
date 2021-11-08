import supertest from 'supertest';
import { rest } from 'msw';
import { server } from '@src/mocks/server';
import app from '../../index';
import {
  mockedColleges,
  mockedCollegesExpected,
} from '../../mocks/dx';
import { BASE_URL } from '../modules/dx';

const request = supertest.agent(app);

describe('/api/colleges', () => {
  it('returns the colleges', async () => {
    server.use(
      rest.get(new RegExp(`${BASE_URL}/jsonapi/taxonomy_term/colleges`), async (req, res, ctx) => {
        return res(ctx.status(200), ctx.json({ data: mockedColleges }));
      }),
    );
    const result = await request.get('/api/colleges');
    expect(result.ok).toBeTruthy();
    expect(result.body).toStrictEqual(mockedCollegesExpected);
  });

  it('should return when there is a 500 error', async () => {
    server.use(
      rest.get(new RegExp(`${BASE_URL}/jsonapi/taxonomy_term/colleges`), async (req, res, ctx) => {
        return res(ctx.status(500));
      }),
    );
    const result = await request.get('/api/colleges')
    expect(result.status).toBe(500);
  });
});
