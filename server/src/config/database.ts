import { Pool, QueryResult, QueryResultRow } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in the environment variables.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Gestion des erreurs globales du pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const db = {
  /**
   * Exécute une requête SQL
   * @param text - La requête SQL
   * @param params - Les paramètres optionnels
   * @returns Une promesse avec le résultat de la requête
   */
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

/**
 * Teste la connexion à la base de données
 * @returns Une promesse vide si la connexion est réussie
 */
export const testConnection = async (): Promise<void> => {
    try {
      await pool.query('SELECT NOW()');
      console.log('Database connection successful');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  };  
