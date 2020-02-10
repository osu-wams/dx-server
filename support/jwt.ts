import { decrypt, verifiedJwt } from '../src/utils/auth';
import { ENCRYPTION_KEY, JWT_KEY } from '../src/constants';

console.log('\n\nUSAGE:\nyarn ts-node support/jwt.ts <encrypted jwt token>\n\n');
const args = process.argv.slice(2);
const [encrypted] = args;
const decrypted = decrypt(encrypted, ENCRYPTION_KEY);
const { user, iat } = verifiedJwt(decrypted, JWT_KEY);

console.log('--Decrypted JWT--');
console.log(decrypted);
console.log(`\n\n--User from JWT issued at ${iat}--`);
console.log(user);

process.exit();
