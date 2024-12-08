<template>
    <div class="min-h-screen flex flex-col justify-center items-center bg-gradient-pink">
      <div class="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <div class="flex justify-center mb-6">
          <img src="@/assets/images/logo/logo.svg" alt="Logo Matcha" class="w-56" />
        </div>
        <h1 class="text-2xl font-bold text-center mb-6 text-gray-700">Connexion</h1>
        <form @submit.prevent="handleLogin">
          <div class="mb-4">
            <label for="email" class="block text-sm font-medium text-gray-600">Email</label>
            <input
              id="email"
              type="email"
              v-model="email"
              class="w-full mt-2 px-4 py-2 border rounded-lg bg-gray-100 text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-dark"
              required
            />
          </div>
          <div class="mb-4">
            <label for="password" class="block text-sm font-medium text-gray-600">Mot de passe</label>
            <input
              id="password"
              type="password"
              v-model="password"
              class="w-full mt-2 px-4 py-2 border rounded-lg bg-gray-100 text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-dark"
              required
            />
            <div class="flex justify-end mt-1">
              <router-link to="/forgot-password" class="text-sm text-pink-dark hover:underline">
                Mot de passe oublié ?
              </router-link>
            </div>
          </div>
          <button type="submit" class="btn btn-primary w-full">Se connecter</button>
        </form>
        <p v-if="errorMessage" class="text-red-500 text-center text-sm mt-4">{{ errorMessage }}</p>
        <p class="text-center text-sm text-gray-600 mt-4">
          Pas encore inscrit ?
          <router-link to="/register" class="text-pink-dark font-semibold hover:underline">Créer un compte</router-link>
        </p>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref } from "vue";
  import { useRouter } from "vue-router";
  
  export default defineComponent({
    name: "LoginView",
    setup() {
      const email = ref("");
      const password = ref("");
      const errorMessage = ref("");
      const router = useRouter();
  
      const handleLogin = async () => {
        try {
          errorMessage.value = "";
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: email.value,
              password: password.value,
            }),
          });
  
          if (response.ok) {
            const data = await response.json();
            localStorage.setItem("authToken", data.token);
            router.push("/profile");
          } else {
            const errorData = await response.json();
            errorMessage.value = errorData.message || "Erreur de connexion. Veuillez vérifier vos informations.";
            console.error("Erreur de connexion :", errorData);
          }
        } catch (error) {
          errorMessage.value = "Impossible de se connecter. Vérifiez votre connexion.";
          console.error("Erreur :", error);
        }
      };
  
      return {
        email,
        password,
        handleLogin,
        errorMessage,
      };
    },
  });
  </script>