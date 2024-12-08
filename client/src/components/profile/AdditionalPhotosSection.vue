<template>
    <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold mb-4">Photos supplémentaires (max 4)</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div v-for="(photo, index) in photos" :key="index"
                class="aspect-square relative rounded-lg overflow-hidden bg-gray-100">
                <img v-if="photo" :src="photo" alt="Photo supplémentaire"
                    class="absolute inset-0 w-full h-full object-cover" />
                <div v-else class="w-full h-full flex items-center justify-center">
                    <span class="text-gray-400">Aucune photo</span>
                </div>
                <input type="file" :ref="el => setFileInputRef(el as HTMLInputElement | null, index)" class="hidden"
                    accept="image/*" @change="handleAdditionalPhotoUpload(index, $event)" />
                <button type="button" @click="triggerAdditionalPhotoInput(index)"
                    class="absolute bottom-2 right-2 bg-teal-600 text-white p-2 rounded-full">
                    <span class="sr-only">Ajouter/Changer la photo</span>
                    <i class="fas fa-camera"></i>
                </button>
                <button type="button" v-if="photo" @click="removeAdditionalPhoto(index)"
                    class="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full">
                    <span class="sr-only">Supprimer la photo</span>
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const props = defineProps<{
    photos: (string | null)[];
}>();

const emit = defineEmits<{
    (e: 'update:photo', index: number, photo: string): void;
    (e: 'remove:photo', index: number): void;
}>();

const fileInputs = ref<{ [key: string]: HTMLInputElement | null }>({});

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
        emit('update:photo', index, resizedPhoto);
        console.log(`Photo supplémentaire ${index + 1} ajoutée avec succès`);
    } catch (error) {
        console.error("Erreur lors du redimensionnement de la photo :", error);
    }
};

const removeAdditionalPhoto = (index: number) => {
    emit('remove:photo', index);
    console.log(`Photo supplémentaire ${index + 1} supprimée`);
};
</script>

<style scoped>
.aspect-square {
    position: relative;
    width: 100%;
    padding-top: 100%;
    overflow: hidden;
    background-color: #f0f0f0;
    border-radius: 0.5rem;
}

.aspect-square img {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: translate(-50%, -50%);
}
</style>