<template>
    <div class="flex-1">
      <div class="grid grid-cols-2 gap-4">
        <InfoField label="Nom d'utilisateur" :value="username" />
        <InfoField label="Email" :value="email" />
        <InfoField label="Prénom" :value="firstName" />
        <InfoField label="Nom" :value="lastName" />
      </div>
    </div>
  </template>
  
  <script lang="ts" setup>
  import InfoField from './InfoField.vue';
  
  defineProps<{
    username: string;
    email: string;
    firstName: string;
    lastName: string;
  }>();
  </script>