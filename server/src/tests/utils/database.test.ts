import { Database } from '../../utils/database';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

// Type pour les résultats des requêtes mockés
type MockQueryResult<T extends QueryResultRow = any> = QueryResult<T>;

// Type pour le client mocké
type MockPoolClient = {
    query: jest.Mock<Promise<MockQueryResult>>;
    release: jest.Mock<Promise<void>>;
};

// Helper function pour créer un résultat vide
const createEmptyResult = (): MockQueryResult => ({
    rows: [],
    rowCount: 0,
    command: '',
    oid: 0,
    fields: []
});

// Mock statique pour pg
const mockQuery = jest.fn();
const mockRelease = jest.fn();
const mockConnect = jest.fn();

jest.mock('pg', () => ({
    Pool: jest.fn(() => ({
        connect: mockConnect
    }))
}));

describe('Database', () => {
    let db: Database;
    let pool: Pool;
    let mockClient: MockPoolClient;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Initialisation du mock client
        mockClient = {
            query: mockQuery,
            release: mockRelease.mockResolvedValue(undefined)
        };
        
        // Configuration de connect pour retourner notre client
        mockConnect.mockResolvedValue(mockClient);
        
        // Création des instances
        pool = new Pool();
        db = new Database(pool);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('query', () => {
        it('should execute a query and return rows', async () => {
            const mockRows = [{ id: 1, name: 'Test' }];
            const mockResult: MockQueryResult = {
                rows: mockRows,
                rowCount: mockRows.length,
                command: 'SELECT',
                oid: 0,
                fields: []
            };

            mockClient.query.mockResolvedValueOnce(mockResult);

            const result = await db.query('SELECT * FROM test');

            expect(mockConnect).toHaveBeenCalledTimes(1);
            expect(mockClient.query).toHaveBeenCalledWith('SELECT * FROM test', undefined);
            expect(mockClient.release).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockRows);
        });

        it('should pass parameters to the query', async () => {
            const mockRows = [{ id: 1 }];
            const mockResult: MockQueryResult = {
                rows: mockRows,
                rowCount: mockRows.length,
                command: 'SELECT',
                oid: 0,
                fields: []
            };

            mockClient.query.mockResolvedValueOnce(mockResult);

            const result = await db.query('SELECT * FROM test WHERE id = $1', [1]);

            expect(mockConnect).toHaveBeenCalledTimes(1);
            expect(mockClient.query).toHaveBeenCalledWith('SELECT * FROM test WHERE id = $1', [1]);
            expect(mockClient.release).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockRows);
        });

        it('should handle query errors and release client', async () => {
            const error = new Error('Query failed');
            mockClient.query.mockRejectedValueOnce(error);

            await expect(db.query('SELECT * FROM test'))
                .rejects
                .toThrow('Query failed');

            expect(mockClient.release).toHaveBeenCalledTimes(1);
        });
    });

    describe('transaction', () => {
        it('should execute a callback within a transaction', async () => {
            const mockRows = [{ id: 1, name: 'Test' }];
            const mockQueryResult: MockQueryResult = {
                rows: mockRows,
                rowCount: mockRows.length,
                command: 'SELECT',
                oid: 0,
                fields: []
            };

            mockClient.query
                .mockResolvedValueOnce(createEmptyResult()) // BEGIN
                .mockResolvedValueOnce(mockQueryResult) // Actual query
                .mockResolvedValueOnce(createEmptyResult()); // COMMIT

            const result = await db.transaction(async (trxClient) => {
                const queryResult = await trxClient.query('SELECT * FROM test');
                return queryResult;
            });

            expect(mockClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
            expect(mockClient.query).toHaveBeenNthCalledWith(2, 'SELECT * FROM test');
            expect(mockClient.query).toHaveBeenNthCalledWith(3, 'COMMIT');
            expect(mockClient.query).toHaveBeenCalledTimes(3);
            expect(result).toEqual(mockQueryResult);
            expect(mockClient.release).toHaveBeenCalledTimes(1);
        });

        it('should rollback transaction on error and release client', async () => {
            const mockError = new Error('Transaction failed');

            mockClient.query
                .mockResolvedValueOnce(createEmptyResult()) // BEGIN
                .mockRejectedValueOnce(mockError) // Failed query
                .mockResolvedValueOnce(createEmptyResult()); // ROLLBACK

            await expect(
                db.transaction(async (trxClient) => {
                    await trxClient.query('SELECT * FROM test');
                })
            ).rejects.toThrow('Transaction failed');

            expect(mockClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
            expect(mockClient.query).toHaveBeenNthCalledWith(2, 'SELECT * FROM test');
            expect(mockClient.query).toHaveBeenNthCalledWith(3, 'ROLLBACK');
            expect(mockClient.query).toHaveBeenCalledTimes(3);
            expect(mockClient.release).toHaveBeenCalledTimes(1);
        });

        it('should handle failed transaction begin properly', async () => {
            const beginError = new Error('BEGIN failed');
            mockClient.query
                .mockRejectedValueOnce(beginError)         // BEGIN échoue
                .mockResolvedValueOnce(createEmptyResult()); // ROLLBACK réussit
        
            await expect(
                db.transaction(async () => {
                    return null;
                })
            ).rejects.toThrow('BEGIN failed');
        
            expect(mockClient.query).toHaveBeenCalledTimes(2);
            expect(mockClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
            expect(mockClient.query).toHaveBeenNthCalledWith(2, 'ROLLBACK');
            expect(mockClient.release).toHaveBeenCalledTimes(1);
        });
    });

    describe('sanitizeInput', () => {
        const testCases = [
            {
                description: 'should remove SQL injection attempts',
                input: 'SELECT * FROM test; DROP TABLE test;',
                expected: 'SELECT FROM test DROP TABLE test'
            },
            {
                description: 'should allow alphanumeric, spaces, and dashes',
                input: 'Valid-Input 123',
                expected: 'Valid-Input 123'
            },
            {
                description: 'should remove special characters',
                input: 'Hello@#$%^&*()World!',
                expected: 'HelloWorld'
            }
        ];

        testCases.forEach(({ description, input, expected }) => {
            it(description, () => {
                expect(db.sanitizeInput(input)).toBe(expected);
            });
        });
    });
});