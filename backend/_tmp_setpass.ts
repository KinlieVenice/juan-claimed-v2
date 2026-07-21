import { hashPassword } from './src/utils/password.js';
import { prisma } from './src/utils/prisma.js';

async function main() {
  const hash = await hashPassword('password123');
  await prisma.dimUser.update({ where: { email: 'juan.delacruz@gmail.com' }, data: { passHash: hash } });
  console.log('done');
}
main().then(() => process.exit(0));
