// server/src/utils/geolocation.ts
import axios from 'axios';

interface LocationData {
   city: string;
   country: string;
}

export const getLocationFromIP = async (ip: string): Promise<LocationData> => {
   try {
       const response = await axios.get(`http://ipapi.co/${ip}/json/`);
       return {
           city: response.data.city,
           country: response.data.country_name
       };
   } catch (error) {
       console.error('Error getting location:', error);
       throw error;
   }
};

// Fallback avec l'API de géocodage si l'IP n'est pas disponible
export const getLocationFromCoords = async (lat: number, lon: number): Promise<LocationData> => {
   try {
       const response = await axios.get(
           `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=${process.env.OPENCAGE_API_KEY}`
       );
       const result = response.data.results[0].components;
       return {
           city: result.city || result.town,
           country: result.country
       };
   } catch (error) {
       console.error('Error getting location:', error);
       throw error;
   }
};