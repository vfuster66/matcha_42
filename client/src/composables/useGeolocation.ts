import { ref } from 'vue';

export function useGeolocation() {
  const location = ref("");

  const setLocation = (value: string) => {
    console.log("Définition de la localisation:", value);
    location.value = value;
  };

  const updateLocation = async () => {
    console.log("Début de la mise à jour de la géolocalisation");
    if (!navigator.geolocation) {
      console.error("Géolocalisation non supportée");
      alert("La géolocalisation n'est pas supportée par votre navigateur");
      return;
    }

    return new Promise<string>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async position => {
          try {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            console.log("Coordonnées obtenues :", latitude, longitude);

            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            console.log("Données géocodées :", data);

            if (data && data.address) {
              const city = data.address.city || data.address.town || data.address.village || "Inconnu";
              const country = data.address.country || "Inconnu";
              const newLocation = `${city}, ${country}`;
              location.value = newLocation;
              console.log("Localisation mise à jour :", location.value);
              resolve(newLocation);
            } else {
              const error = "Impossible de récupérer les informations de localisation";
              console.error(error);
              alert("Impossible d'obtenir votre position précise.");
              reject(error);
            }
          } catch (error) {
            console.error("Erreur lors de l'appel à l'API de géocodage :", error);
            alert("Erreur lors de la récupération de votre position.");
            reject(error);
          }
        },
        error => {
          console.error("Erreur de géolocalisation :", error);
          alert("Impossible d'obtenir votre position.");
          reject(error);
        }
      );
    });
  };

  return {
    location,
    setLocation,
    updateLocation
  };
}