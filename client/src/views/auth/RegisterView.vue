<template>
	<div class="min-h-screen flex flex-col justify-center items-center bg-gradient-green">
		<div class="w-full max-w-md bg-white rounded-lg shadow-md p-8">
			<div class="flex justify-center mb-6">
				<img src="@/assets/images/logo/logo.svg" alt="Logo Matcha" class="w-56" />
			</div>
			<h1 class="text-2xl font-bold text-center mb-6 text-gray-700">Inscription</h1>
			<form @submit.prevent="handleRegister">
				<div class="mb-4">
					<label for="username" class="block text-sm font-medium text-gray-600">Nom d'utilisateur</label>
					<input id="username" v-model="username"
						class="w-full mt-2 px-4 py-2 border rounded-lg bg-gray-100 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-dark"
						required />
				</div>
				<div class="mb-4">
					<label for="email" class="block text-sm font-medium text-gray-600">Email</label>
					<input id="email" type="email" v-model="email"
						class="w-full mt-2 px-4 py-2 border rounded-lg bg-gray-100 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-dark"
						required />
				</div>
				<div class="mb-4">
					<label for="password" class="block text-sm font-medium text-gray-600">Mot de passe</label>
					<input id="password" type="password" v-model="password"
						class="w-full mt-2 px-4 py-2 border rounded-lg bg-gray-100 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-dark"
						required />
				</div>
				<div class="mb-4">
					<label for="firstName" class="block text-sm font-medium text-gray-600">Prénom</label>
					<input id="firstName" v-model="firstName"
						class="w-full mt-2 px-4 py-2 border rounded-lg bg-gray-100 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-dark"
						required />
				</div>
				<div class="mb-4">
					<label for="lastName" class="block text-sm font-medium text-gray-600">Nom</label>
					<input id="lastName" v-model="lastName"
						class="w-full mt-2 px-4 py-2 border rounded-lg bg-gray-100 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-dark"
						required />
				</div>
				<button type="submit" class="btn btn-secondary w-full">S'inscrire</button>
			</form>
			<p class="text-center text-sm text-gray-600 mt-4">
				Déjà inscrit ?
				<router-link to="/login" class="text-teal-dark font-semibold hover:underline">Se connecter</router-link>
			</p>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { useRouter } from "vue-router";

export default defineComponent({
	name: "RegisterView",
	setup() {
		const username = ref("");
		const email = ref("");
		const password = ref("");
		const firstName = ref("");
		const lastName = ref("");
		const router = useRouter();

		const handleRegister = async () => {
			try {
				console.log("Envoi des données:", {
					username: username.value,
					email: email.value,
					password: password.value,
					firstName: firstName.value,
					lastName: lastName.value,
				});

				const response = await fetch("/api/auth/register", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						username: username.value,
						email: email.value,
						password: password.value,
						firstName: firstName.value,
						lastName: lastName.value,
					}),
				});

				// Log de la réponse brute
				console.log("Status réponse:", response.status);
				const responseText = await response.text();
				console.log("Réponse brute:", responseText);

				let data;
				try {
					data = JSON.parse(responseText);
				} catch (e) {
					console.error("Erreur parsing JSON:", e);
					throw new Error("Réponse invalide du serveur");
				}

				if (response.ok) {
					console.log("Inscription réussie:", data);
					router.push("/login");
				} else {
					console.error("Erreur d'inscription:", data.message || "Erreur inconnue");
				}
			} catch (error) {
				console.error("Erreur détaillée:", error);
			}
		};

		return {
			username,
			email,
			password,
			firstName,
			lastName,
			handleRegister,
		};
	},
});
</script>