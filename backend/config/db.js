import {neon} from '@neondatabase/serverless';
import "dotenv/config";

// Create a SQL Connect using or DB URL
export const sql = neon(process.env.DATABASE_URL)