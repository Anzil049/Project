import { ROUTES } from './src/constants/routes.js';
console.log('CONTACT PATH:', ROUTES.CONTACT);
if (ROUTES.CONTACT === '/contact') {
  console.log('ROUTES.CONTACT is correct');
} else {
  console.log('ROUTES.CONTACT is WRONG or UNDEFINED:', ROUTES.CONTACT);
}
