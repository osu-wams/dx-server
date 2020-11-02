/* eslint-disable no-unused-vars */

import { findOrUpsertUser, setColleges, updateOAuthData } from '../user-account';
import User from '../../models/user';
import { mockUser } from '../../models/__mocks__/user';
import mockDegrees from '../../../mocks/osu/degrees.data.json';

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
  describe('setColleges', () => {
    beforeEach(() => {
      mockUser.colleges = [];
    });

    it('returns an existing user with added colleges', async () => {
      expect.assertions(1);
      const user = await setColleges(mockUser, [mockDegrees.data[0].attributes]);
      expect(user.colleges).toEqual(['5', '6']);
    });
    it('returns an existing user who has no colleges', async () => {
      expect.assertions(1);
      const user = await setColleges(mockUser, []);
      expect(user.colleges).toEqual([]);
    });
    it('throws an error on failure', async () => {
      mockUserModel.find.mockImplementationOnce(() =>
        Promise.reject(new Error('happy little accident')),
      );
      try {
        const user = await setColleges(mockUser, [mockDegrees.data[0].attributes]);
      } catch (err) {
        expect(err.message).toBe('happy little accident');
      }
    });
  });
});
