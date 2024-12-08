"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocationFromCoords = exports.getLocationFromIP = void 0;
// server/src/utils/geolocation.ts
const axios_1 = __importDefault(require("axios"));
const getLocationFromIP = async (ip) => {
    try {
        const response = await axios_1.default.get(`http://ipapi.co/${ip}/json/`);
        return {
            city: response.data.city,
            country: response.data.country_name
        };
    }
    catch (error) {
        console.error('Error getting location:', error);
        throw error;
    }
};
exports.getLocationFromIP = getLocationFromIP;
// Fallback avec l'API de géocodage si l'IP n'est pas disponible
const getLocationFromCoords = async (lat, lon) => {
    try {
        const response = await axios_1.default.get(`https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=${process.env.OPENCAGE_API_KEY}`);
        const result = response.data.results[0].components;
        return {
            city: result.city || result.town,
            country: result.country
        };
    }
    catch (error) {
        console.error('Error getting location:', error);
        throw error;
    }
};
exports.getLocationFromCoords = getLocationFromCoords;
