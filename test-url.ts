import 'dotenv/config';
import { generateAuthUrl } from './src/auth/oauth.js';

generateAuthUrl().then(url => {
    console.log("AUTH_URL:", url);
}).catch(console.error);
