import { Request, Response, NextFunction } from 'express'; // eslint-disable-line no-unused-vars
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { User as UserLib } from '@osu-wams/lib';
import { ENV, GROUPS, IV_LENGTH } from '../constants';
import { User, find, upsert } from '../api/models/user'; // eslint-disable-line no-unused-vars
import logger from '../logger';

interface Jwt {
  email: string;
  osuId: number;
  iat: number;
  exp: number;
  scope: 'refresh' | 'api';
}

export const lastLogin = (): string => new Date().toISOString().slice(0, 10);

const parseSamlResult = (profile: any, done: any) => {
  const user = {
    osuId: parseInt(profile['urn:oid:1.3.6.1.4.1.5016.2.1.2.1'], 10), // '123456789'
    email: profile['urn:oid:1.3.6.1.4.1.5923.1.1.1.6'], // 'nobody@nobody.nobody'
    primaryAffiliation: profile['urn:oid:1.3.6.1.4.1.5923.1.1.1.5'], // 'employee'
    nameID: profile.nameID,
    nameIDFormat: profile.nameIDFormat,
    firstName: profile['urn:oid:2.5.4.42'] || 'Not Provided', // 'Bob'
    lastName: profile['urn:oid:2.5.4.4'] || 'Not Provided', // 'Ross'
    groups: [],
    affiliations: profile['urn:oid:1.3.6.1.4.1.5923.1.1.1.1'], // ['member', 'employee']
    isAdmin: false,
    onid: profile['urn:oid:0.9.2342.19200300.100.1.1'], // 'rossb'
    lastLogin: lastLogin(),
  };

  if (!user.osuId) {
    logger().error(
      `Saml response did not include 'osuId' required field (urn:oid:1.3.6.1.4.1.5016.2.1.2.1) value. Response values: ${JSON.stringify(
        user,
      )}, Profile values: ${JSON.stringify(profile)}`,
    );
  }

  if (!user.firstName) {
    logger().error(
      `Saml response did not include 'firstName' required field (urn:oid:2.5.4.42) value. Response values: ${JSON.stringify(
        user,
      )}, Profile values: ${JSON.stringify(profile)}`,
    );
  }

  if (!user.lastName) {
    logger().error(
      `Saml response did not include 'lastName' required field (urn:oid:2.5.4.4) value. Response values: ${JSON.stringify(
        user,
      )}, Profile values: ${JSON.stringify(profile)}`,
    );
  }

  if (!user.email) {
    logger().error(
      `Saml response did not include 'email' required field (urn:oid:1.3.6.1.4.1.5923.1.1.1.6) value. Response values: ${JSON.stringify(
        user,
      )}, Profile values: ${JSON.stringify(profile)}`,
    );
  }

  if (!user.primaryAffiliation) {
    logger().error(
      `Saml response did not include 'primaryAffiliation' required field (urn:oid:1.3.6.1.4.1.5923.1.1.1.5) value. Response values: ${JSON.stringify(
        user,
      )}, Profile values: ${JSON.stringify(profile)}`,
    );
  }

  if (!user.affiliations || !user.affiliations.length) {
    logger().error(
      `Saml response did not include 'affiliations' required field (urn:oid:1.3.6.1.4.1.5923.1.1.1.1) values, populating with primaryAffiliation. Response values: ${JSON.stringify(
        user,
      )}, Profile values: ${JSON.stringify(profile)}`,
    );
    user.affiliations = [user.primaryAffiliation];
  }

  if (!user.onid) {
    logger().error(
      `Saml response did not include 'onid' required field (urn:oid:0.9.2342.19200300.100.1.1) value. Response values: ${JSON.stringify(
        user,
      )}, Profile values: ${JSON.stringify(profile)}`,
    );
  }

  const permissions = profile['urn:oid:1.3.6.1.4.1.5923.1.1.1.7'] || [];
  if (permissions.includes(GROUPS.admin)) {
    user.isAdmin = true;
    user.groups.push('admin');
  }
  if (permissions.includes(GROUPS.masquerade)) {
    // On production, only administrators can also have access to masquerade,
    // regardless of grouper group assignment.
    if (ENV === 'production') {
      if (user.isAdmin) user.groups.push('masquerade');
    } else {
      user.groups.push('masquerade');
    }
  }

  if (user.primaryAffiliation.toLowerCase() === 'other') {
    logger().debug(
      "Saml user has 'other' as primaryAffiliation, setting it to 'employee' as the default.",
    );
    user.primaryAffiliation = UserLib.AFFILIATIONS.employee;
  }

  const otherIndex = user.affiliations.findIndex((a) => a.toLowerCase() === 'other');
  if (otherIndex > -1) {
    logger().debug(
      "Saml user has 'other' in affiliations, setting it to 'employee' as the default.",
    );
    user.affiliations[otherIndex] = UserLib.AFFILIATIONS.employee;
  }

  return done(null, user);
};

const encodedHash = (s: string): string => crypto.createHash('sha256').update(s).digest('base64');
export const verifiedJwt = (token: string, jwtKey: string): Jwt => {
  try {
    return jwt.verify(token, jwtKey) as Jwt;
  } catch (err) {
    logger().error(
      `utils/Auth#verifiedJwt failed to verify the provided token, this is a serious problem that indicates the signing key (JWT_KEY) has been changed and this token is still being used, or that the token was malformed or tampered with. At any rate, this problem needs attention. Error: ${err}`,
    );
    throw err;
  }
};

/**
 * Simple method using nodes crypto to encrypt a string of text
 * @param text the text to encrypt
 * @param key the key used for encrypting text
 */
export const encrypt = (text: string, key: string): string | null => {
  try {
    const iv = crypto.randomBytes(IV_LENGTH / 2).toString('hex');
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return `${iv}:${encrypted}`;
  } catch (err) {
    logger().error(`utils/Auth#encrypt failed to encrypt provided string: ${err}`);
    return null;
  }
};

/**
 * Simple method using nodes crypto to decrypt a string of text
 * @param encrypted the text to decrypt
 * @param key the key used for decrypting text
 */
export const decrypt = (encrypted: string, key: string): string | null => {
  try {
    const [iv, data] = encrypted.split(':');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    return decipher.update(data, 'base64', 'utf8');
  } catch (err) {
    logger().warn(
      `utils/Auth#decrypt failed to decrypt provided string, this would typically be unexpected and indicates an encryption key or IV has changed or that the string is malformed or tampered with. Error: ${err}`,
    );
    return null;
  }
};

/**
 * Verify the token has not been tampered with, return the User stored in the token or null if there was an error.
 * @param token the jwt to verify
 * @param jwtKey the key to used when signing the jwt
 */
export const userFromJWT = async (token: string, jwtKey: string): Promise<User | undefined> => {
  let validToken: Jwt;
  try {
    validToken = verifiedJwt(token, jwtKey);
  } catch (err) {
    return undefined;
  }
  const { osuId, scope } = validToken;
  if (osuId) {
    const user = await find(osuId);
    if (ENV === 'test' || scope === 'api') return user;

    const hashedToken = encodedHash(token);
    if (scope === 'refresh' && user.mobileRefreshTokenHash === hashedToken) {
      return user;
    }
    logger().info(
      `utils/Auth#userFromJWT hashed refresh token provided does not match what is stored for the user in mobileRefreshTokenHash, user must reauthenticate to establish a new token`,
    );
  }
  return undefined;
};

/**
 * Issue a new JWT of the user or null if there was an error.
 * @param user the user to create a jwt of
 * @param encryptionKey the key for encrypting the jwt
 * @param jwtKey the key for signing the jwt
 */
export const issueJWT = async (
  user: User,
  encryptionKey: string,
  jwtKey: string,
): Promise<string | null> => {
  try {
    const hourInSec = 60 * 60;
    const iat = Date.now();
    const exp = hourInSec * 1000 + iat;
    const signed = jwt.sign(
      { osuId: user.osuId, email: user.email, iat, exp, scope: 'api' },
      jwtKey,
    );
    return encrypt(signed, encryptionKey);
  } catch (err) {
    logger().error(
      `utils/Auth#issueJWT failed to sign and encrypt the User as a JWT, this is a serious problem that needs to be addressed. Error: ${err.stack}`,
    );
    return null;
  }
};

/**
 * Issue a new Refresh JWT token for user or null if there was an error.
 * @param user the user to create a jwt of
 * @param encryptionKey the key for encrypting the jwt
 * @param jwtKey the key for signing the jwt
 */
export const issueRefresh = async (
  user: User,
  encryptionKey: string,
  jwtKey: string,
): Promise<string | null> => {
  try {
    const iat = Date.now();
    const exp = 365 * 24 * 60 * 60 * 1000 + iat; // a year from now
    const mobileRefreshToken = jwt.sign(
      { osuId: user.osuId, email: user.email, iat, exp, scope: 'refresh' },
      jwtKey,
    );
    const mobileRefreshTokenHash = encodedHash(mobileRefreshToken);
    const updatedUser = await upsert({ ...user, mobileRefreshTokenHash });
    if (updatedUser) {
      return encrypt(mobileRefreshToken, encryptionKey);
    }
    return null;
  } catch (err) {
    logger().error(
      `utils/Auth#issueRefresh failed to sign and encrypt the User as a JWT, this is a serious problem that needs to be addressed. Error: ${err.stack}`,
    );
    return null;
  }
};

export default parseSamlResult;
