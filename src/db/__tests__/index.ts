import { scan, updateItem, getItem, putItem } from '../index';

describe('scan', () => {
  it('should return an empty promise result', async () => {
    expect(scan({ TableName: 'test' })).resolves.toBe('');
  });
});

describe('updateItem', () => {
  it('should return an empty promise result', async () => {
    expect(updateItem({ TableName: 'test', Key: { longLive: { S: 'BobRoss' } } })).resolves.toBe(
      ''
    );
  });
});

describe('putItem', () => {
  it('should return an empty promise result', async () => {
    expect(putItem({ TableName: 'test', Item: { longLive: { S: 'BobRoss' } } })).resolves.toBe('');
  });
});

describe('getItem', () => {
  it('should return an empty promise result', async () => {
    expect(getItem({ TableName: 'test', Key: { longLive: { S: 'BobRoss' } } })).resolves.toBe('');
  });
});
