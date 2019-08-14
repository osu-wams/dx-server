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

  static insert = async (props: User): Promise<User> => {
    try {
    } catch (err) {
      throw err;
    }
  };

  static find = async (id: number): Promise<User | null> => {
    try {
    } catch (err) {
      throw err;
    }
  };
}

export default User;
