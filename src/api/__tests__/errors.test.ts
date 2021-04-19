import supertest from 'supertest';
import { Types } from '@osu-wams/lib';
import app from '../../index';

const request = supertest.agent(app);

describe('/errors', () => {
  it('should return success', async () => {
    await request.post('/api/errors').send({ error: 'test', stack: 'blah' }).expect(200);
  });
});

describe('/errors/app-message', () => {
  const message: Types.Message = {
    body: 'Message Body',
    title: 'Message Title',
    type: 'error',
    visible: true,
    id: 'id123',
  };
  it('should return success', async () => {
    await request.post('/api/errors/app-message').send({ message }).expect(200);
  });
});
