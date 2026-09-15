import { createApplication } from './server/app.js';

createApplication().catch(error=>{console.error('Server startup failed:',error.message);process.exitCode=1;});
