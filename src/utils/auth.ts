import { Request, Response, NextFunction } from 'express'; // eslint-disable-line no-unused-vars
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { User as UserLib } from '@osu-wams/lib';
import { getCache, AUTH_DB, setCache } from '../api/modules/cache';
import { ENV, GROUPS, IV_LENGTH } from '../constants';
import { User } from '../api/models/user'; // eslint-disable-line no-unused-vars
import logger from '../logger';

interface Jwt {
  user: User;
  iat: number;
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
      `Saml response did not include 'osuId' required field (urn:oid:1.3.6.1.4.1.5016.2.1.2.1) value. Response values: `,
      JSON.stringify(user),
      ` Profile values: `,
      JSON.stringify(profile),
    );
  }

  if (!user.firstName) {
    logger().error(
      `Saml response did not include 'firstName' required field (urn:oid:2.5.4.42) value. \n Response values: `,
      JSON.stringify(user),
      ` Profile values: `,
      JSON.stringify(profile),
    );
  }

  if (!user.lastName) {
    logger().error(
      `Saml response did not include 'lastName' required field (urn:oid:2.5.4.4) value. \n Response values: `,
      JSON.stringify(user),
      ` Profile values: `,
      JSON.stringify(profile),
    );
  }

  if (!user.email) {
    logger().error(
      `Saml response did not include 'email' required field (urn:oid:1.3.6.1.4.1.5923.1.1.1.6) value. \n Response values: `,
      JSON.stringify(user),
      ` Profile values: `,
      JSON.stringify(profile),
    );
  }

  if (!user.primaryAffiliation) {
    logger().error(
      `Saml response did not include 'primaryAffiliation' required field (urn:oid:1.3.6.1.4.1.5923.1.1.1.5) value. \n Response values: `,
      JSON.stringify(user),
      ` Profile values: `,
      JSON.stringify(profile),
    );
  }

  if (!user.affiliations || !user.affiliations.length) {
    logger().error(
      `Saml response did not include 'affiliations' required field (urn:oid:1.3.6.1.4.1.5923.1.1.1.1) values, populating with primaryAffiliation.\n Response values: `,
      JSON.stringify(user),
      ` Profile values: `,
      JSON.stringify(profile),
    );
    user.affiliations = [user.primaryAffiliation];
  }

  if (!user.onid) {
    logger().error(
      `Saml response did not include 'onid' required field (urn:oid:0.9.2342.19200300.100.1.1) value.\n Response values: `,
      JSON.stringify(user),
      ` Profile values: `,
      JSON.stringify(profile),
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

const cacheKey = (user: User, iat: number) => `${iat.toString()}-${user.email}`;

export const verifiedJwt = (token: string, jwtKey: string): Jwt => jwt.verify(token, jwtKey) as Jwt;

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
export const userFromJWT = async (token: string, jwtKey: string): Promise<User | null> => {
  try {
    const verified = verifiedJwt(token, jwtKey);
    const validated = await getCache(cacheKey(verified.user, verified.iat), AUTH_DB);
    if (validated) {
      return verified.user;
    }
    return null;
  } catch (err) {
    logger().error(
      `utils/Auth#userFromJWT failed to verify the provided token, this is a serious problem that indicates the signing key (JWT_KEY) has been changed and this token is still being used, or that the token was malformed or tampered with. At any rate, this problem needs attention. Error: ${err}`,
    );
    return null;
  }
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
    const iat = Date.now();
    const signed = jwt.sign({ user, iat }, jwtKey);
    // ! Track more data in the cache, issueAt, lastUsed, etc?
    const didCache = await setCache(
      cacheKey(user, iat),
      iat.toString(),
      { mode: 'EX', duration: 365 * 24 * 60 * 60, flag: 'NX' },
      AUTH_DB,
    );
    if (didCache) {
      return encrypt(signed, encryptionKey);
    }
    return null;
  } catch (err) {
    logger().error(
      `utils/Auth#issueJWT failed to sign and encrypt the User as a JWT, this is a serious problem that needs to be addressed. Error: ${err.stack}`,
    );
    return null;
  }
};

export default parseSamlResult;
