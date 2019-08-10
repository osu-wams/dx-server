import { Pool, OkPacket } from 'mysql2/promise'; // eslint-disable-line no-unused-vars
import { dbQuery } from '../../db';
import { DbUser } from '../modules/user-account'; // eslint-disable-line no-unused-vars

class User {
  osuId: number;

  firstName: string;

  lastName: string;

  email: string;

  phone: string;

  isAdmin: boolean = false;

  refreshToken: string = '';

  canvasOauthExpire: number = 0;

  canvasOauthToken: string = '';

  isCanvasOptIn: boolean = false;

  constructor(dbUser?: DbUser) {
    if (dbUser) {
      this.osuId = parseInt(dbUser.osu_id, 10);
      this.firstName = dbUser.first_name;
      this.lastName = dbUser.last_name;
      this.email = dbUser.email;
      this.phone = dbUser.phone;
    }
  }

  static insert = async (props: User, dbPool: Pool): Promise<User> => {
    try {
      const { osuId, firstName, lastName, email } = props;
      const dbUser: any = await dbPool.query(dbQuery.insertUser, [
        osuId,
        firstName,
        lastName,
        email
      ]);

      await dbPool.query(dbQuery.insertOAuthData, [osuId, '', false]);
      if (dbUser.affectedRows === 0) {
        throw new Error(`User.insert failed to insert user: ${props}`);
      }
      return new User({
        osu_id: props.osuId.toString(),
        first_name: props.firstName,
        last_name: props.lastName,
        email: props.email,
        phone: ''
      });
    } catch (err) {
      throw err;
    }
  };

  static find = async (id: number, dbPool: Pool): Promise<User | null> => {
    try {
      const results: any = await dbPool.query(dbQuery.selectUser, [id]);
      console.debug('selectUser db returns:', results); // eslint-disable-line no-console
      if (!results || results.length === 0) {
        return null;
      }
      return new User(results[0]);
    } catch (err) {
      throw err;
    }
  };
}

export default User;
