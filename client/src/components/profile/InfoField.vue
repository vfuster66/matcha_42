<template>
	<div>
		<label class="block text-sm font-medium text-gray-700">{{ label }}</label>
		<p class="mt-1 p-2 bg-gray-50 rounded">{{ value }}</p>
	</div>
</template>

<script lang="ts" setup>
defineProps<{
	label: string;
	value: string;
}>();
</script>