import 'dotenv/config';
import { exchangeCode } from './src/auth/oauth.js';

const code = "4/0AeoWuM_zAUc9vJ9VYzx6UhhqSMDnC9WxvmEmThmsUJp4R48eyJEoyR43vAP72hgr_sLNSQ";

exchangeCode(code).then(() => {
    console.log("SUCCESS! Tokens saved successfully.");
}).catch(console.error);
