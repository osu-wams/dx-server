/* eslint-disable no-unused-vars */

import { findOrUpsertUser, setColleges, updateOAuthData } from '../user-account';
import { mockUser } from '../../models/__mocks__/user';
import mockDegrees from '../../../mocks/osu/degrees.data.json';

const mockFindReturn = jest.fn();
const mockUpdateCanvasDataReturn = jest.fn();
jest.mock('../../models/user', () => ({
  ...jest.requireActual('../../models/user'),
  find: () => mockFindReturn(),
  updateCanvasData: () => mockUpdateCanvasDataReturn(),
}));

describe('User Account module', () => {
  describe('findOrUpsertUser', () => {
    it('returns an existing user', async () => {
      mockFindReturn.mockResolvedValue(mockUser);
      const { user, isNew } = await findOrUpsertUser(mockUser);
      expect(user.osuId).toEqual(mockUser.osuId);
      expect(isNew).toBeFalsy();
    });
    it('returns a new user', async () => {
      mockFindReturn.mockResolvedValue(null);
      const { user, isNew } = await findOrUpsertUser(mockUser);
      expect(user.osuId).toEqual(mockUser.osuId);
      expect(isNew).toBeTruthy();
    });
    it('throws an error on failure', async () => {
      mockFindReturn.mockRejectedValue(new Error('happy little accident'));
      try {
        const { user, isNew } = await findOrUpsertUser(mockUser);
      } catch (err) {
        expect(err.message).toBe('happy little accident');
      }
    });
  });
  describe('updateOAuthData', () => {
    it('returns an updated user', async () => {
      const updatedUser = { ...mockUser, canvasRefreshToken: 'token', canvasOptIn: true };
      mockUpdateCanvasDataReturn.mockResolvedValue(updatedUser);
      expect.assertions(2);
      const user = await updateOAuthData(mockUser, {
        account: { refreshToken: 'token' },
        isCanvasOptIn: true,
      });
      expect(user.canvasRefreshToken).toEqual('token');
      expect(user.canvasOptIn).toBeTruthy();
    });
    it('throws an error on failure', async () => {
      mockUpdateCanvasDataReturn.mockRejectedValue(new Error('happy little accident'));
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
      mockFindReturn.mockResolvedValue(mockUser);
    });

    it('returns an existing user with added colleges', async () => {
      const user = await setColleges(mockUser, [mockDegrees.data[0].attributes]);
      expect(user.colleges).toEqual(['5', '6']);
    });
    it('returns an existing user who has no colleges', async () => {
      const user = await setColleges(mockUser, []);
      expect(user.colleges).toEqual([]);
    });
    it('throws an error on failure', async () => {
      mockFindReturn.mockRejectedValueOnce(new Error('happy little accident'));
      try {
        const user = await setColleges(mockUser, [mockDegrees.data[0].attributes]);
      } catch (err) {
        expect(err.message).toBe('happy little accident');
      }
    });
  });
});
