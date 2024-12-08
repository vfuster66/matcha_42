// src/config/database.ts
import { Pool, QueryResult, QueryResultRow } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
	throw new Error('DATABASE_URL is not defined in the environment variables.');
}  

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
	console.error('Unexpected error on idle client', err);
	process.exit(-1);
});

export const db = {
	query: async <T extends QueryResultRow = any>(
		text: string,
		params?: any[],
	): Promise<QueryResult<T>> => {
		try {
			return await pool.query<T>(text, params);
		} catch (error) {
			console.error('Query error:', { text, params, error });
			throw error;
		}
	},
};

export const testConnection = async (): Promise<void> => {
	try {
		await pool.query('SELECT NOW()');
		console.log('Database connection successful');
	} catch (error) {
		console.error('Database connection failed:', error);
		throw error;
	}
};  
