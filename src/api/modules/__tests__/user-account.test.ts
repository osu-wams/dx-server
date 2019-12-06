/* eslint-disable no-unused-vars */

import { findOrUpsertUser, updateOAuthData } from '../user-account';
import User from '../../models/user';
import { mockUser } from '../../models/__mocks__/user';

jest.mock('../../models/user');
const mockUserModel = User as jest.Mocked<any>;

describe('User Account module', () => {
  describe('findOrUpsertUser', () => {
    it('returns an existing user', async () => {
      expect.assertions(2);
      const { user, isNew } = await findOrUpsertUser(mockUser);
      expect(user.osuId).toEqual(mockUser.osuId);
      expect(isNew).toBeFalsy();
    });
    it('returns a new user', async () => {
      mockUserModel.find.mockImplementationOnce(() => Promise.resolve(null));
      expect.assertions(2);
      const { user, isNew } = await findOrUpsertUser(mockUser);
      expect(user.osuId).toEqual(mockUser.osuId);
      expect(isNew).toBeTruthy();
    });
    it('throws an error on failure', async () => {
      mockUserModel.find.mockImplementationOnce(() =>
        Promise.reject(new Error('happy little accident')),
      );
      try {
        const { user, isNew } = await findOrUpsertUser(mockUser);
      } catch (err) {
        expect(err.message).toBe('happy little accident');
      }
    });
  });
  describe('updateOAuthData', () => {
    it('returns an updated user', async () => {
      const updatedUser = { ...mockUser, refreshToken: 'token', isCanvasOptIn: true };
      mockUserModel.updateCanvasData.mockImplementationOnce(() => Promise.resolve(updatedUser));
      expect.assertions(2);
      const user = await updateOAuthData(mockUser, {
        account: { refreshToken: 'token' },
        isCanvasOptIn: true,
      });
      expect(user.refreshToken).toEqual('token');
      expect(user.isCanvasOptIn).toBeTruthy();
    });
    it('throws an error on failure', async () => {
      mockUserModel.updateCanvasData.mockImplementationOnce(() =>
        Promise.reject(new Error('happy little accident')),
      );
      try {
        await updateOAuthData(mockUser, {
          account: { refreshToken: 'token' },
          isCanvasOptIn: true,
        });
      } catch (err) {
        expect(err.message).toBe('happy little accident');
      }
    });
  });
});
