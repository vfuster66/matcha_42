"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const pg_1 = require("pg");
// Mock de pg
jest.mock('pg', () => {
    const mockPool = {
        query: jest.fn(),
        on: jest.fn(),
    };
    return { Pool: jest.fn(() => mockPool) };
});
describe('Database Configuration', () => {
    let pool;
    beforeEach(() => {
        // Réinitialiser les mocks entre chaque test
        jest.clearAllMocks();
        pool = new pg_1.Pool();
    });
    describe('db.query', () => {
        it('should execute a query successfully', async () => {
            const mockResult = {
                rows: [{ id: 1, name: 'test' }],
                rowCount: 1,
                command: 'SELECT',
                oid: 0,
                fields: [],
            };
            pool.query.mockResolvedValueOnce(mockResult);
            const result = await database_1.db.query('SELECT * FROM test');
            expect(result).toEqual(mockResult);
            expect(pool.query).toHaveBeenCalledWith('SELECT * FROM test', undefined);
        });
        it('should execute a query with parameters', async () => {
            const mockResult = {
                rows: [{ id: 1, name: 'test' }],
                rowCount: 1,
                command: 'SELECT',
                oid: 0,
                fields: [],
            };
            pool.query.mockResolvedValueOnce(mockResult);
            const params = [1, 'test'];
            const result = await database_1.db.query('SELECT * FROM test WHERE id = $1 AND name = $2', params);
            expect(result).toEqual(mockResult);
            expect(pool.query).toHaveBeenCalledWith('SELECT * FROM test WHERE id = $1 AND name = $2', params);
        });
        it('should connect successfully', async () => {
            pool.query.mockResolvedValueOnce({
                rows: [{ now: new Date() }],
            });
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            await (0, database_1.testConnection)();
            expect(consoleSpy).toHaveBeenCalledWith('Database connection successful');
            expect(pool.query).toHaveBeenCalledWith('SELECT NOW()');
            consoleSpy.mockRestore();
        });
    });
    describe('testConnection', () => {
        it('should connect successfully', async () => {
            pool.query.mockResolvedValueOnce({
                rows: [{ now: new Date() }],
            });
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            await (0, database_1.testConnection)();
            expect(consoleSpy).toHaveBeenCalledWith('Database connection successful');
            expect(pool.query).toHaveBeenCalledWith('SELECT NOW()');
            consoleSpy.mockRestore();
        });
        it('should handle connection errors', async () => {
            const errorMessage = 'Connection failed';
            pool.query.mockRejectedValueOnce(new Error(errorMessage));
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            await expect((0, database_1.testConnection)()).rejects.toThrow(errorMessage);
            expect(consoleSpy).toHaveBeenCalledWith('Database connection failed:', expect.any(Error));
            consoleSpy.mockRestore();
        });
    });
    describe('Environment Configuration', () => {
        const originalEnv = process.env;
        beforeEach(() => {
            jest.resetModules();
            process.env = { ...originalEnv };
        });
        afterAll(() => {
            process.env = originalEnv;
        });
        it('should use the correct database URL from environment', () => {
            process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
            jest.resetModules(); // Réinitialise les modules entre les tests
            jest.isolateModules(() => {
                const { Pool } = require('pg'); // Réimportation dans un contexte isolé
                require('../config/database'); // Charge le module testé
                expect(Pool).toHaveBeenCalledWith({
                    connectionString: 'postgresql://test:test@localhost:5432/testdb',
                });
            });
        });
        it('should handle missing database URL', () => {
            delete process.env.DATABASE_URL;
            jest.isolateModules(() => {
                expect(() => require('../config/database')).not.toThrow();
            });
        });
    });
});
