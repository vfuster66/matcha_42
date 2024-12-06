import { Pool, QueryConfig } from 'pg';

export class Database {
    private pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    async query<T>(sql: string | QueryConfig, params?: any[]): Promise<T[]> {
        const client = await this.pool.connect();
        try {
            const result = await client.query(sql, params);
            return result.rows;
        } finally {
            client.release();
        }
    }

    async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    sanitizeInput(input: string): string {
        return input.replace(/[^\w\s-]/gi, '');
    }
}