import { ref } from 'vue';

export function useImageUpload() {
  const errorMessage = ref<string | null>(null);

  const resizeImage = (file: File, maxSize = 300): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        }
      };

      reader.onerror = () => {
        reject("Erreur lors du chargement du fichier");
      };

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject("Impossible de créer le contexte canvas");
          return;
        }

        // Définir les dimensions
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = maxSize;
        canvas.height = maxSize;

        // Dessiner l'image redimensionnée centrée
        const offsetX = (maxSize - img.width * scale) / 2;
        const offsetY = (maxSize - img.height * scale) / 2;

        ctx.fillStyle = "#ffffff"; // Fond blanc (si nécessaire)
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(
          img,
          0,
          0,
          img.width,
          img.height,
          offsetX,
          offsetY,
          img.width * scale,
          img.height * scale
        );

        resolve(canvas.toDataURL("image/jpeg"));
      };

      img.onerror = () => {
        reject("Erreur lors du traitement de l'image");
      };

      reader.readAsDataURL(file);
    });
  };

  return {
    errorMessage,
    resizeImage
  };
}