import supertest from 'supertest';
import app from '../../index';

const request = supertest.agent(app);

describe('/errors', () => {
  it('should return success', async () => {
    await request
      .post('/api/errors')
      .send({ error: 'test', stack: 'blah' })
      .expect(200);
  });
});
