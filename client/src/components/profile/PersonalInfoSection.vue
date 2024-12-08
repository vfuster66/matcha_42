<template>
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-xl font-semibold mb-4">Informations personnelles</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Date de naissance -->
        <div>
          <label class="block text-sm font-medium text-gray-700">Date de naissance *</label>
          <input 
            type="date" 
            :value="birthDate"
            @input="e => $emit('update:birthDate', (e.target as HTMLInputElement).value)"
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500" 
          />
        </div>
  
        <!-- Genre -->
        <div>
          <label class="block text-sm font-medium text-gray-700">Genre *</label>
          <select 
            :value="gender"
            @change="e => $emit('update:gender', (e.target as HTMLSelectElement).value)"
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
          >
            <option value="">Sélectionnez</option>
            <option value="male">Homme</option>
            <option value="female">Femme</option>
            <option value="other">Autre</option>
          </select>
        </div>
  
        <!-- Orientation sexuelle -->
        <div>
          <label class="block text-sm font-medium text-gray-700">Orientation sexuelle *</label>
          <select 
            :value="sexualPreference"
            @change="e => $emit('update:sexualPreference', (e.target as HTMLSelectElement).value)"
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
          >
            <option value="">Sélectionnez</option>
            <option value="heterosexual">Hétérosexuel(le)</option>
            <option value="homosexual">Homosexuel(le)</option>
            <option value="bisexual">Bisexuel(le)</option>
          </select>
        </div>
  
        <!-- Localisation -->
        <div>
            <label class="block text-sm font-medium text-gray-700">Localisation *</label>
            <div class="mt-1 flex gap-2">
                <input 
                :value="location"
                readonly 
                placeholder="Localisation automatique"
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500" 
                />
                <button 
                type="button" 
                @click="$emit('updateLocation')"
                class="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
                >
                Actualiser
                </button>
            </div>
        </div>
      </div>
    </div>
  </template>
  
  <script lang="ts" setup>
  defineProps<{
    birthDate: string;
    gender: string;
    sexualPreference: string;
    location: string;
  }>();
  
  defineEmits<{
  (e: 'update:birthDate', value: string): void;
  (e: 'update:gender', value: string): void;
  (e: 'update:sexualPreference', value: string): void;
  (e: 'update:location', value: string): void;
  (e: 'update-location'): void;
}>();
  </script>