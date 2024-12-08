<template>
    <div class="w-40">
      <div class="aspect-square relative rounded-lg overflow-hidden bg-gray-100">
        <img 
          v-if="profileImageUrl" 
          :src="profileImageUrl" 
          alt="Photo de profil"
          class="w-full h-full object-cover" 
        />
        <div v-else class="w-full h-full flex items-center justify-center">
          <span class="text-gray-400">Aucune photo</span>
        </div>
        <input 
          type="file" 
          ref="fileInput" 
          class="hidden" 
          accept="image/*"
          @change="handleChange" 
        />
        <button 
          type="button"
          @click="triggerFileInput"
          class="absolute bottom-2 right-2 bg-teal-600 text-white p-2 rounded-full hover:bg-teal-700"
        >
          <span class="sr-only">Changer la photo</span>
          <i class="fas fa-camera"></i>
        </button>
      </div>
      <p v-if="!profileImageUrl" class="text-sm text-red-600 mt-2">
        * Photo de profil requise pour interagir avec les autres utilisateurs
      </p>
    </div>
  </template>
  
  <script lang="ts" setup>
  import { ref } from 'vue';
  
  defineProps<{
    profileImageUrl: string;
  }>();
  
  const emit = defineEmits<{
    (e: 'change', file: File): void;
  }>();
  
  const fileInput = ref<HTMLInputElement | null>(null);
  
  const triggerFileInput = () => {
    fileInput.value?.click();
  };
  
  const handleChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      emit('change', input.files[0]);
    }
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