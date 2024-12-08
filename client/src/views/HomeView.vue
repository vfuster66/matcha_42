<template>
    <div class="min-h-screen flex flex-col bg-gradient-to-br from-[#f7faff] to-[#ffe4f2]">
      <!-- Header -->
      <header class="flex justify-center py-8">
        <img src="@/assets/images/logo/logo_g.svg" alt="Logo Matcha" class="w-104" />
      </header>
  
      <!-- Main Section -->
      <main class="flex-1 flex flex-col items-center">
        <h1 class="text-6xl font-extrabold text-teal-dark mb-4 drop-shadow-md">
          Bienvenue !
        </h1>
        <p class="text-lg text-gray-600 mb-12 text-center italic">
          Parce que chaque belle histoire commence par une rencontre.
        </p>
        <div class="flex space-x-8">
          <router-link to="/login">
            <button class="btn btn-primary text-xl px-10 py-5 shadow-md">Connexion</button>
          </router-link>
          <router-link to="/register">
            <button class="btn btn-secondary text-xl px-10 py-5 shadow-md">Inscription</button>
          </router-link>
        </div>
      </main>
  
      <!-- Footer -->
      <footer class="py-4 text-center text-sm text-gray-600">
        <p>&copy; 2024 Matcha. Tous droits réservés.</p>
      </footer>
    </div>
  </template>
  
  <script lang="ts">
  export default {
    name: "HomeView",
  };
  </script>
  