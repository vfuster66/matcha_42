<template>
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <h1 class="text-2xl font-bold mb-6">{{ title }}</h1>
  
      <div class="flex items-start gap-6">
        <ProfilePhoto 
          :profile-image-url="profileImageUrl"
          @change="handleMainPhotoUpload"
        />
  
        <ProfileInfo 
          :username="username"
          :email="email"
          :first-name="firstName"
          :last-name="lastName"
        />
      </div>
    </div>
  </template>
  
  <script lang="ts" setup>
  import ProfilePhoto from './ProfilePhoto.vue';
  import ProfileInfo from './ProfileInfo.vue';
  
  defineProps<{
    title: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    profileImageUrl: string;
  }>();
  
  const emit = defineEmits<{
    (e: 'update:photo', photo: File): void;
  }>();
  
  const handleMainPhotoUpload = (file: File) => {
    emit('update:photo', file);
  };
  </script>