<template>
	<div class="bg-white rounded-lg shadow-md p-6">
		<h2 class="text-xl font-semibold mb-4">Biographie *</h2>
		<textarea :value="biography" @input="e => $emit('update:biography', (e.target as HTMLTextAreaElement).value)"
			required rows="4"
			class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
			placeholder="Parlez-nous de vous..."></textarea>
	</div>
</template>

<script lang="ts" setup>
defineProps<{
	biography: string;
}>();

defineEmits<{
	(e: 'update:biography', value: string): void;
}>();
</script>