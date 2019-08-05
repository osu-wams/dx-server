/* eslint-disable no-console, no-unused-vars */

let dbm;
let type;
let seed;

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */
const setup = (options, seedLink) => {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

const up = db => {
  return db
    .createTable('users', {
      osu_id: { type: 'int', primaryKey: true },
      first_name: 'string',
      last_name: 'string',
      email: 'string',
      phone: 'bigint'
    })
    .then(
      result => {
        console.debug('Users migration users table created', result);
        db.createTable('oauth_data', {
          osu_id: {
            type: 'int',
            notNull: true,
            unique: true,
            foreignKey: {
              table: 'users',
              name: 'users_osuid',
              mapping: 'osu_id',
              rules: {
                onUpdate: 'RESTRICT',
                onDelete: 'CASCADE'
              }
            }
          },
          refresh_token: {
            type: 'string',
            length: 4096
          },
          opt_in: 'boolean'
        });
      },
      err => {
        console.error('Users migration up failed', err);
        throw err;
      }
    );
};

const down = db => {
  return db.dropTable('oauth_data').then(
    result => {
      console.debug('Users migration down oauth_data table dropped', result);
      db.dropTable('users').then(usersResult =>
        console.debug('Users migration down users table dropped', usersResult)
      );
    },
    err => {
      console.error('Users migration down failed', err);
      throw err;
    }
  );
};

/* eslint-disable */
const _meta = {
  version: 1
};
/* eslint-enable */

module.exports = { setup, up, down, _meta };
