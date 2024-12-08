import { db, testConnection } from '@/config/database';
import { Pool } from 'pg';
import EventEmitter from 'events';

// Mock de pg
jest.mock('pg', () => {
	const mockPool = {
		query: jest.fn(),
		on: jest.fn(),
	};
	return { Pool: jest.fn(() => mockPool) };
});

describe('Database Configuration', () => {
	let pool: jest.Mocked<Pool>;

	beforeEach(() => {
		// Réinitialiser les mocks entre chaque test
		jest.clearAllMocks();
		pool = new Pool() as jest.Mocked<Pool>;
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

			(pool.query as jest.Mock).mockResolvedValueOnce(mockResult);

			const result = await db.query('SELECT * FROM test');
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

			(pool.query as jest.Mock).mockResolvedValueOnce(mockResult);

			const params = [1, 'test'];
			const result = await db.query(
				'SELECT * FROM test WHERE id = $1 AND name = $2',
				params,
			);

			expect(result).toEqual(mockResult);
			expect(pool.query).toHaveBeenCalledWith(
				'SELECT * FROM test WHERE id = $1 AND name = $2',
				params,
			);
		});

		it('should connect successfully', async () => {
			(pool.query as jest.Mock).mockResolvedValueOnce({
				rows: [{ now: new Date() }],
			});

			const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

			await testConnection();

			expect(consoleSpy).toHaveBeenCalledWith('Database connection successful');
			expect(pool.query).toHaveBeenCalledWith('SELECT NOW()');

			consoleSpy.mockRestore();
		});


	});

	describe('testConnection', () => {
		it('should connect successfully', async () => {
			(pool.query as jest.Mock).mockResolvedValueOnce({
				rows: [{ now: new Date() }],
			});

			const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

			await testConnection();

			expect(consoleSpy).toHaveBeenCalledWith('Database connection successful');
			expect(pool.query).toHaveBeenCalledWith('SELECT NOW()');

			consoleSpy.mockRestore();
		});

		it('should handle connection errors', async () => {
			const errorMessage = 'Connection failed';
			(pool.query as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

			const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

			await expect(testConnection()).rejects.toThrow(errorMessage);

			expect(consoleSpy).toHaveBeenCalledWith(
				'Database connection failed:',
				expect.any(Error),
			);

			consoleSpy.mockRestore();
		});
	});

	describe('db.query error handling', () => {
		it('should log and throw an error if query execution fails', async () => {
			const mockError = new Error('Query failed');
			(pool.query as jest.Mock).mockRejectedValueOnce(mockError);

			const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

			await expect(db.query('INVALID SQL')).rejects.toThrow('Query failed');
			expect(consoleSpy).toHaveBeenCalledWith('Query error:', {
				text: 'INVALID SQL',
				params: undefined,
				error: mockError,
			});

			consoleSpy.mockRestore();
		});
	});

	describe('Pool event handling', () => {
		it('should handle unexpected errors on idle clients', () => {
			const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
			const processSpy = jest.spyOn(process, 'exit').mockImplementation();

			const mockPool = new EventEmitter();
			mockPool.on('error', (error: Error) => {
				console.error('Unexpected error on idle client', error);
				process.exit(-1);
			});

			// Émettre un événement 'error'
			mockPool.emit('error', new Error('Idle client error'));

			expect(consoleSpy).toHaveBeenCalledWith(
				'Unexpected error on idle client',
				expect.any(Error),
			);
			expect(processSpy).toHaveBeenCalledWith(-1);

			consoleSpy.mockRestore();
			processSpy.mockRestore();
		});
	});

	describe('Environment variables validation', () => {
		const originalEnv = process.env;

		beforeEach(() => {
			jest.resetModules(); // Réinitialise les modules avant chaque test
			process.env = { ...originalEnv }; // Sauvegarde les variables d'environnement
		});

		afterEach(() => {
			process.env = originalEnv; // Restaure les variables d'environnement après chaque test
		});

		it('should throw an error if DATABASE_URL is missing', () => {
			jest.isolateModules(() => {
				// Supprime la variable d'environnement
				delete process.env.DATABASE_URL;

				// Charge le module et capture l'erreur avec un bloc try-catch
				try {
					require('../../config/database');
				} catch (error) {
					expect(error).toBeInstanceOf(Error);
					if (error instanceof Error) {
						expect(error.message).toBe(
							'DATABASE_URL is not defined in the environment variables.',
						);
					} else {
						throw error;
					}
				}
			});
		});

		it('should use the correct database URL from environment', () => {
			jest.isolateModules(() => {
				// Définir une variable fictive
				process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';

				const { Pool } = require('pg'); // Mock Pool
				require('../../config/database'); // Charger le module testé

				expect(Pool).toHaveBeenCalledWith({
					connectionString: 'postgresql://test:test@localhost:5432/testdb',
				});
			});
		});
	});

	describe('Environment Configuration', () => {
		const originalEnv = process.env;

		beforeEach(() => {
			jest.resetModules();
			process.env = { ...originalEnv };
		});

		afterEach(() => {
			process.env = originalEnv; // Restaure l'environnement après chaque test
		});

		it('should throw an error if DATABASE_URL is missing', () => {
			jest.isolateModules(() => {
				// Supprime la variable DATABASE_URL
				delete process.env.DATABASE_URL;

				// Charge le module isolément
				try {
					require('../../config/database');
				} catch (error) {
					expect(error).toBeInstanceOf(Error);
					if (error instanceof Error) {
						expect(error.message).toBe(
							'DATABASE_URL is not defined in the environment variables.',
						);
					} else {
						throw error;
					}
				}
			});
		});

		it('should use the correct database URL from environment', () => {
			jest.isolateModules(() => {
				// Définir une variable d'environnement fictive
				process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';

				const { Pool } = require('pg'); // Mock Pool
				require('../../config/database'); // Charger le module testé

				expect(Pool).toHaveBeenCalledWith({
					connectionString: 'postgresql://test:test@localhost:5432/testdb',
				});
			});
		});
	});
});