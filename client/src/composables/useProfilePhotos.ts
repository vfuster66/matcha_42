import { ref } from 'vue';
import { useImageUpload } from './useImageUpload';

export function useProfilePhotos() {
  const { resizeImage } = useImageUpload();
  const profileImageUrl = ref("");
  const additionalPhotos = ref<(string | null)[]>([null, null, null, null]);
  const fileInputs = ref<{ [key: string]: HTMLInputElement | null }>({});
  
  const handleMainPhotoUpload = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      console.error("Aucun fichier sélectionné");
      return;
    }

    const file = input.files[0];
    try {
      const resizedPhoto = await resizeImage(file, 300);
      profileImageUrl.value = resizedPhoto;
      console.log("Photo de profil chargée avec succès");
    } catch (error) {
      console.error("Erreur lors du chargement de l'image :", error);
    }
  };

  const setFileInputRef = (el: HTMLInputElement | null, index: number) => {
    const refName = `fileInput-${index}`;
    if (el) {
      fileInputs.value[refName] = el;
    } else {
      delete fileInputs.value[refName];
    }
  };

  const triggerAdditionalPhotoInput = (index: number) => {
    const refName = `fileInput-${index}`;
    const input = fileInputs.value[refName];
    if (input) {
      input.click();
    } else {
      console.error(`Ref "${refName}" introuvable`);
    }
  };

  const handleAdditionalPhotoUpload = async (index: number, event: Event) => {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      console.error("Aucun fichier sélectionné");
      return;
    }

    const file = input.files[0];
    try {
      const resizedPhoto = await resizeImage(file, 300);
      additionalPhotos.value[index] = resizedPhoto;
      console.log(`Photo supplémentaire ${index + 1} ajoutée avec succès`);
    } catch (error) {
      console.error("Erreur lors du redimensionnement de la photo :", error);
    }
  };

  const removeAdditionalPhoto = (index: number) => {
    additionalPhotos.value[index] = null;
    console.log(`Photo supplémentaire ${index + 1} supprimée`);
  };

  const initializePhotos = (mainPhoto: string | null, additional: (string | null)[]) => {
    profileImageUrl.value = mainPhoto || "";
    additionalPhotos.value = Array(4)
      .fill(null)
      .map((_, i) => additional?.[i] || null);
  };

  return {
    profileImageUrl,
    additionalPhotos,
    fileInputs,
    handleMainPhotoUpload,
    setFileInputRef,
    triggerAdditionalPhotoInput,
    handleAdditionalPhotoUpload,
    removeAdditionalPhoto,
    initializePhotos
  };
}