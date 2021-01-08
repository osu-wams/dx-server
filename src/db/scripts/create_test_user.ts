/* eslint-disable no-console, no-unused-vars */

import { User, upsert } from '../../api/models/user';
import logger from '../../logger';

// Provide the ability to create a test user for localhost full masquerade
const testUser: User = {
  osuId: 933012345,
  firstName: 'Bob',
  lastName: 'Ross',
  email: 'bob@bobross.com',
  phone: '5551212',
  isAdmin: false,
  primaryAffiliation: 'employee',
  groups: [],
  affiliations: ['employee'],
  onid: 'rossb',
};

upsert(testUser)
  .then((_v) => {
    logger().info('Created user.', testUser);
  })
  .catch((err) => console.error(err));
