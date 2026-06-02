import 'dotenv/config';
import { generateAuthUrl } from './dist/auth/oauth.js';

generateAuthUrl().then(url => {
    console.log("AUTH_URL:", url);
}).catch(console.error);
