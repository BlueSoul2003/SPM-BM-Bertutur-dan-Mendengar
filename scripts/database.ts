import 'dotenv/config';
import {openDatabase,migrate} from '../server/database.js';
import {backup,restore} from '../server/backups.js';
import {importLegacy} from '../server/accounts.js';

const [action,filename]=process.argv.slice(2);
if(!['backup','restore','import'].includes(action)||!filename)throw new Error('Usage: npm run db -- backup|restore|import <filename>');
const db=await openDatabase();
try{await migrate(db);const result=action==='backup'?await backup(db,filename):action==='restore'?await restore(db,filename):await importLegacy(db,filename);console.log({action,result});}
finally{await db.close();}
