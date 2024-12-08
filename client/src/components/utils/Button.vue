<template>
    <button
      :class="[
        'px-6 py-2 rounded-md font-semibold transition-all duration-300',
        variant === 'default' ? 'bg-teal-500 text-white hover:bg-teal-600' : '',
        variant === 'secondary' ? 'bg-pink-500 text-white hover:bg-pink-600' : '',
        variant === 'outline' ? 'border-2 border-teal-500 text-teal-500 hover:bg-teal-500 hover:text-white' : ''
      ]"
    >
      <slot />
    </button>
  </template>
  
  <script setup lang="ts">
  defineProps({
    variant: {
      type: String,
      default: 'default',
      validator: (value: string) =>
        ['default', 'secondary', 'outline'].includes(value),
    },
  });
  </script>
  