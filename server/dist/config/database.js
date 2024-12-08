"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testConnection = exports.db = void 0;
// src/config/database.ts
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined in the environment variables.');
}
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});
exports.db = {
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
