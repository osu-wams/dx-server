import mysql from 'promise-mysql';
import config from 'config';

// Configure RDS store
export const pool = mysql.createPool({
  connectionLimit: 10,
  host: config.get('rds.host'),
  port: config.get('rds.port'),
  user: config.get('rds.user'),
  password: config.get('rds.password'),
  database: config.get('rds.database')
});

// Query object for our users and oauth tables manipulations
export const dbQuery = {
  selectUser: 'SELECT * FROM users WHERE osu_id = ?',
  insertUser: 'INSERT INTO users (osu_id, first_name, last_name, email) VALUES (?, ?, ?, ?)',
  selectOAuthData: 'SELECT * FROM oauth_data WHERE osu_id = ?',
  insertOAuthData: 'INSERT INTO oauth_data (osu_id, refresh_token, opt_in) VALUES (?, ?, ?)',
  updateOAuthData: 'UPDATE oauth_data SET opt_in = ?, refresh_token = ? WHERE osu_id = ?',
  resetAllRefreshToken: 'UPDATE oauth_data SET refresh_token = NULL WHERE 1'
};
