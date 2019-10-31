import supertest from 'supertest';
import app from '../../index';

let request: supertest.SuperTest<supertest.Test>;

beforeAll(async () => {
  request = supertest.agent(app);
});

describe('/masquerade', () => {
  beforeEach(async () => {
    // Authenticate before each request
    await request.get('/login');
  });

  it('starts and stops masquerade session', async () => {
    await request
      .post('/api/masquerade')
      .send({ masqueradeId: 123123, masqueradeReason: 'Because' })
      .expect(200, 'Masquerade session started.');
    await request.post('/api/masquerade').expect(200, 'Masquerade session ended.');
  });

  it('fails to start a session without a masqueradeId', async () => {
    await request
      .post('/api/masquerade')
      .expect(500, { message: 'No masqueradeId or masqueradeReason supplied.' });
  });

  it('gets a null when there is no session established', async () => {
    await request.get('/api/masquerade').expect(200, { masqueradeId: '', masqueradeReason: '' });
  });

  it('gets a current masquerade session', async () => {
    await request
      .post('/api/masquerade')
      .send({ masqueradeId: 123123, masqueradeReason: 'Because' })
      .expect(200, 'Masquerade session started.');
    await request
      .get('/api/masquerade')
      .expect(200, { masqueradeId: 123123, masqueradeReason: 'Because' });
  });
});
