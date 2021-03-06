import supertest from 'supertest';
import app from '../../index';
import User from '../models/user';
import { mockUser } from '../models/__mocks__/user';

jest.mock('../models/user');
const mockUserModel = User as jest.Mocked<any>;

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

  it('gets a current masquerade session for a user from the database', async () => {
    const mockedUser = { ...mockUser, osuId: 123123 };
    mockUserModel.find.mockImplementationOnce(() => Promise.resolve(mockedUser));
    await request
      .post('/api/masquerade')
      .send({ masqueradeId: 123123, masqueradeReason: 'Because' })
      .expect(200, 'Masquerade session started.');
    await request.get('/api/masquerade').expect(200, {
      masquerade: {
        lastName: 'Ross',
        lastLogin: new Date().toISOString().slice(0, 10),
        affiliations: ['employee'],
        primaryAffiliation: 'employee',
        onid: 'rossb',
        firstName: 'Bob',
        osuId: 123123,
        email: 'bob@bobross.com',
        canvasOptIn: true,
      },
      masqueradeId: 123123,
      masqueradeReason: 'Because',
    });
  });

  it('gets a current masquerade session for a user not found in the database', async () => {
    mockUserModel.find.mockImplementationOnce(() => Promise.resolve(undefined));
    await request
      .post('/api/masquerade')
      .send({ masqueradeId: 123123, masqueradeReason: 'Because' })
      .expect(200, 'Masquerade session started.');
    await request.get('/api/masquerade').expect(200, {
      masqueradeId: 123123,
      masqueradeReason: 'Because',
    });
  });
});
