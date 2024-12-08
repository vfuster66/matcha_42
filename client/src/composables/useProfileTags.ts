import { ref } from 'vue';

export function useProfileTags() {
  const tags = ref<string[]>([]);
  const newTag = ref("");

  const addTag = () => {
    console.log("Fonction addTag appelée");
    console.log("Valeur brute de l'input :", newTag.value);

    if (!newTag.value.trim()) {
      console.log("Input vide, abandon de l'ajout");
      return;
    }

    // Formater le tag
    let tagToAdd = newTag.value.trim();
    console.log("Tag après trim :", tagToAdd);

    tagToAdd = tagToAdd.startsWith('#') ? tagToAdd : `#${tagToAdd}`;
    console.log("Tag après formatage avec # :", tagToAdd);

    // Créer une copie du tableau actuel
    const currentTags = Array.from(tags.value);
    console.log("Tags actuels :", currentTags);

    // Vérifier si le tag existe déjà
    if (!currentTags.includes(tagToAdd)) {
      console.log('Ajout du nouveau tag :', tagToAdd);
      // Créer un nouveau tableau avec le nouveau tag
      tags.value = [...currentTags, tagToAdd];
      console.log('Nouvelle valeur de tags :', tags.value);
    } else {
      console.log('Tag déjà existant, pas d\'ajout');
    }

    // Réinitialiser le champ
    newTag.value = "";
    console.log("Input réinitialisé");
  };

  const removeTag = (tag: string) => {
    console.log("Tentative de suppression du tag :", tag);
    console.log("Tags avant suppression :", tags.value);
    tags.value = tags.value.filter(t => t !== tag);
    console.log("Tags après suppression :", tags.value);
  };

  // Méthode pour initialiser les tags
  const initializeTags = (initialTags: string[]) => {
    console.log("Initialisation des tags avec :", initialTags);
    tags.value = initialTags.map(tag => tag.startsWith('#') ? tag : `#${tag}`);
    console.log("Tags initialisés :", tags.value);
  };

  return {
    tags,
    newTag,
    addTag,
    removeTag,
    initializeTags
  };
}