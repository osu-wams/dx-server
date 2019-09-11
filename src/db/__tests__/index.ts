import nock from 'nock';
import { scan, updateItem, getItem, putItem, DYNAMODB_ENDPOINT } from '../index';

describe('scan', () => {
  it('should return an empty promise result', async () => {
    nock(DYNAMODB_ENDPOINT)
      .post(/.*/)
      .reply(200, {});
    expect(scan({ TableName: 'test' })).resolves.toStrictEqual({});
  });
});

describe('updateItem', () => {
  it('should return an empty promise result', async () => {
    nock(DYNAMODB_ENDPOINT)
      .post(/.*/)
      .reply(200, {});
    expect(
      updateItem({ TableName: 'test', Key: { longLive: { S: 'BobRoss' } } })
    ).resolves.toStrictEqual({});
  });
});

describe('putItem', () => {
  it('should return an empty promise result', async () => {
    nock(DYNAMODB_ENDPOINT)
      .post(/.*/)
      .reply(200, {});
    expect(
      putItem({ TableName: 'test', Item: { longLive: { S: 'BobRoss' } } })
    ).resolves.toStrictEqual({});
  });
});

describe('getItem', () => {
  nock(DYNAMODB_ENDPOINT)
    .post(/.*/)
    .reply(200, {});
  it('should return an empty promise result', async () => {
    expect(
      getItem({ TableName: 'test', Key: { longLive: { S: 'BobRoss' } } })
    ).resolves.toStrictEqual({});
  });
});
