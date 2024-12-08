import axios from 'axios';
import { getLocationFromIP, getLocationFromCoords } from '../../utils/geolocation';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Geolocation Utils', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getLocationFromIP', () => {
        const mockIP = '8.8.8.8';
        
        it('should return location data from IP address', async () => {
            const mockResponse = {
                data: {
                    city: 'Mountain View',
                    country_name: 'United States'
                }
            };

            mockedAxios.get.mockResolvedValueOnce(mockResponse);

            const result = await getLocationFromIP(mockIP);

            expect(mockedAxios.get).toHaveBeenCalledWith(`http://ipapi.co/${mockIP}/json/`);
            expect(result).toEqual({
                city: 'Mountain View',
                country: 'United States'
            });
        });

        it('should handle empty or null response data', async () => {
            const mockResponse = {
                data: {
                    city: null,
                    country_name: null
                }
            };

            mockedAxios.get.mockResolvedValueOnce(mockResponse);

            const result = await getLocationFromIP(mockIP);

            expect(result).toEqual({
                city: null,
                country: null
            });
        });

        it('should handle network errors', async () => {
            const mockError = new Error('Network Error');
            mockedAxios.get.mockRejectedValueOnce(mockError);

            await expect(getLocationFromIP(mockIP))
                .rejects
                .toThrow('Network Error');
            
            expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        });

        it('should handle API errors', async () => {
            const mockError = {
                response: {
                    status: 429,
                    data: { error: 'Too Many Requests' }
                }
            };
            mockedAxios.get.mockRejectedValueOnce(mockError);

            await expect(getLocationFromIP(mockIP))
                .rejects
                .toEqual(mockError);
        });
    });

    describe('getLocationFromCoords', () => {
        const mockLat = 37.4224764;
        const mockLon = -122.0842499;

        beforeEach(() => {
            process.env.OPENCAGE_API_KEY = 'test-api-key';
        });

        it('should return location data from coordinates with city', async () => {
            const mockResponse = {
                data: {
                    results: [{
                        components: {
                            city: 'Mountain View',
                            country: 'United States'
                        }
                    }]
                }
            };

            mockedAxios.get.mockResolvedValueOnce(mockResponse);

            const result = await getLocationFromCoords(mockLat, mockLon);

            expect(mockedAxios.get).toHaveBeenCalledWith(
                `https://api.opencagedata.com/geocode/v1/json?q=${mockLat}+${mockLon}&key=test-api-key`
            );
            expect(result).toEqual({
                city: 'Mountain View',
                country: 'United States'
            });
        });

        it('should return location data from coordinates with town fallback', async () => {
            const mockResponse = {
                data: {
                    results: [{
                        components: {
                            town: 'Small Town',
                            country: 'United States'
                        }
                    }]
                }
            };

            mockedAxios.get.mockResolvedValueOnce(mockResponse);

            const result = await getLocationFromCoords(mockLat, mockLon);

            expect(result).toEqual({
                city: 'Small Town',
                country: 'United States'
            });
        });

        it('should handle missing API key', async () => {
            process.env.OPENCAGE_API_KEY = '';

            const mockResponse = {
                data: {
                    results: [{
                        components: {
                            city: 'Mountain View',
                            country: 'United States'
                        }
                    }]
                }
            };

            mockedAxios.get.mockResolvedValueOnce(mockResponse);

            const result = await getLocationFromCoords(mockLat, mockLon);

            expect(mockedAxios.get).toHaveBeenCalledWith(
                `https://api.opencagedata.com/geocode/v1/json?q=${mockLat}+${mockLon}&key=`
            );
        });

        it('should handle empty results array', async () => {
            const mockResponse = {
                data: {
                    results: []
                }
            };

            mockedAxios.get.mockResolvedValueOnce(mockResponse);

            await expect(getLocationFromCoords(mockLat, mockLon))
                .rejects
                .toThrow();
        });

        it('should handle network errors', async () => {
            const mockError = new Error('Network Error');
            mockedAxios.get.mockRejectedValueOnce(mockError);

            await expect(getLocationFromCoords(mockLat, mockLon))
                .rejects
                .toThrow('Network Error');
            
            expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        });

        it('should handle malformed response data', async () => {
            const mockResponse = {
                data: {
                    results: [{
                        components: {
                            // Données manquantes
                        }
                    }]
                }
            };

            mockedAxios.get.mockResolvedValueOnce(mockResponse);

            const result = await getLocationFromCoords(mockLat, mockLon);

            expect(result).toEqual({
                city: undefined,
                country: undefined
            });
        });

        it('should handle invalid coordinates', async () => {
            const invalidLat = 91; // Latitude invalide
            const invalidLon = 181; // Longitude invalide

            const mockError = new Error('Invalid coordinates');
            mockedAxios.get.mockRejectedValueOnce(mockError);

            await expect(getLocationFromCoords(invalidLat, invalidLon))
                .rejects
                .toThrow();
            
            expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        });
    });
});