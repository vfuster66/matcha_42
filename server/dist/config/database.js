"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testConnection = exports.db = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined in the environment variables.');
}
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
// Gestion des erreurs globales du pool
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});
exports.db = {
    /**
     * Exécute une requête SQL
     * @param text - La requête SQL
     * @param params - Les paramètres optionnels
     * @returns Une promesse avec le résultat de la requête
     */
    query: async (text, params) => {
        try {
            return await pool.query(text, params);
        }
        catch (error) {
            console.error('Query error:', { text, params, error });
            throw error;
        }
    },
};
/**
 * Teste la connexion à la base de données
 * @returns Une promesse vide si la connexion est réussie
 */
const testConnection = async () => {
    try {
        await pool.query('SELECT NOW()');
        console.log('Database connection successful');
    }
    catch (error) {
        console.error('Database connection failed:', error);
        throw error;
    }
};
exports.testConnection = testConnection;
