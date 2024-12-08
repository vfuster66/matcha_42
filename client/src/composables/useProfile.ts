import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useProfileTags } from './useProfileTags';
import { useProfilePhotos } from './useProfilePhotos';
import { useGeolocation } from './useGeolocation';

export function useProfile() {
  const router = useRouter();

  // Données de base du profil
  const username = ref("");
  const email = ref("");
  const firstName = ref("");
  const lastName = ref("");
  const birthDate = ref("");
  const gender = ref("");
  const errorMessage = ref("");
  const sexualPreference = ref("");
  const biography = ref("");
  
  // Récupérer les gestionnaires de tags et photos
  const { tags, initializeTags } = useProfileTags();
  const { profileImageUrl, additionalPhotos, initializePhotos } = useProfilePhotos();
  const { location, setLocation, updateLocation } = useGeolocation();

  const handleLocationUpdate = async () => {
    try {
      const newLocation = await updateLocation();
      if (newLocation) {
        setLocation(newLocation);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la localisation:", error);
    }
  };

  const loadUserProfile = async () => {
    console.log("Début du chargement du profil utilisateur");
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.error("Token non disponible");
        throw new Error("Token non disponible. Veuillez vous connecter.");
      }

      console.log("Envoi de la requête GET /api/auth/me");
      const response = await fetch("/api/auth/me", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        console.log("Données brutes reçues du serveur :", userData);

        // Initialisation des données de base
        username.value = userData.username;
        email.value = userData.email;
        firstName.value = userData.firstName;
        lastName.value = userData.lastName;
        gender.value = userData.gender || "";
        sexualPreference.value = userData.sexualPreference || "";
        biography.value = userData.biography || "";

        // Initialisation des photos
        initializePhotos(userData.profileImageUrl, userData.additionalPhotos);

        // Initialisation des tags
        if (Array.isArray(userData.interests)) {
          initializeTags(userData.interests);
        } else {
          initializeTags([]);
        }

        if (userData.location) {
          setLocation(userData.location);
        }

        // Gestion de la date de naissance
        if (userData.birthDate) {
          const date = new Date(userData.birthDate);
          birthDate.value = date.toISOString().split("T")[0];
        }

        console.log("Chargement du profil terminé avec succès");
        return userData;
      } else if (response.status === 401) {
        console.error("Utilisateur non authentifié");
        errorMessage.value = "Session expirée. Veuillez vous reconnecter.";
        router.push("/login");
      } else {
        const errorData = await response.json();
        console.error("Erreur lors du chargement du profil:", errorData);
        errorMessage.value = "Impossible de charger le profil";
      }
    } catch (error) {
      console.error("Erreur réseau complète:", error);
      errorMessage.value = "Erreur réseau. Impossible de charger le profil.";
    }
  };

  const saveProfile = async () => {
    try {
      const formattedBirthDate = birthDate.value
        ? new Date(birthDate.value).toISOString()
        : null;

      const profileData = {
        username: username.value,
        email: email.value,
        firstName: firstName.value,
        lastName: lastName.value,
        birthDate: formattedBirthDate,
        gender: gender.value,
        sexualPreference: sexualPreference.value,
        location: location.value,
        biography: biography.value,
        interests: Array.from(tags.value),
        profileImageUrl: profileImageUrl.value,
        additionalPhotos: additionalPhotos.value.filter(photo => photo !== null),
      };

      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de la sauvegarde du profil");
      }

      alert("Profil sauvegardé avec succès !");
      router.push("/dashboard");

    } catch (error) {
      console.error("Erreur lors de la sauvegarde :", error);
      errorMessage.value = "Erreur lors de la sauvegarde du profil";
      throw error;
    }
  };

  return {
    username,
    email,
    firstName,
    lastName,
    birthDate,
    gender,
    errorMessage,
    sexualPreference,
    biography,
    location,
    updateLocation: handleLocationUpdate,
    profileImageUrl,
    additionalPhotos,
    tags,
    loadUserProfile,
    saveProfile
  };
}

