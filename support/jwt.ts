import { decrypt, userFromJWT, verifiedJwt, issueRefresh } from '../src/utils/auth';
import { ENCRYPTION_KEY, JWT_KEY } from '../src/constants';
import { find } from '../src/api/models/user';

const read = async (token: string) => {
  const jwt = decrypt(token, ENCRYPTION_KEY);
  const user = await userFromJWT(jwt, JWT_KEY);
  console.log(`User ${user.osuId} from JWT\n\n`);
  console.log(user);
};

const create = async (osuId: number) => {
  const user = await find(osuId);
  if (!user) {
    console.error(`User ${osuId} not found, exiting.`);
    process.exit(1);
  }
  const refreshToken = await issueRefresh(user, ENCRYPTION_KEY, JWT_KEY);
  console.log(`\n\nIssued a new Refresh Token for user ${osuId}:`);
  console.log(refreshToken);
};

const args = process.argv.slice(2);
const [command, value] = args;
if (!command || !value) {
  console.error('\n\nUSAGE:\nyarn ts-node support/jwt.ts [read|create] [token|osuId]\n');
  console.error('example: yarn ts-node support/jwt.ts read some-long-token-string');
  console.error('example: yarn ts-node support/jwt.ts create 111111111');
  process.exit(1);
}

(async () => {
  switch (command.toLowerCase()) {
    case 'read':
      await read(value);
      break;
    case 'create':
      await create(parseInt(value, 10));
      break;
    default:
      console.error('Command not supported, try either "read" or "create"');
      break;
  }
  process.exit();
})();
