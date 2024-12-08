<template>
    <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold mb-4">Centres d'intérêt *</h2>
        <div class="mb-4 flex gap-2">
            <input v-model="localNewTag" @keyup.enter.prevent="addNewTag" placeholder="Ajoutez un tag (ex: #vegan)"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500" />
            <button type="button" @click="addNewTag"
                class="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700">
                Ajouter
            </button>
        </div>
        <div class="flex flex-wrap gap-2">
            <span v-for="tag in tags" :key="tag"
                class="bg-teal-100 text-teal-800 px-3 py-1 rounded-full flex items-center gap-2">
                {{ tag }}
                <button type="button" @click="removeTag(tag)" class="text-teal-600 hover:text-teal-800">
                    ×
                </button>
            </span>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useProfileTags } from '@/composables/useProfileTags';

const props = defineProps<{
    tags: string[];
}>();

const emit = defineEmits<{
    (e: 'update:tags', tags: string[]): void;
    (e: 'add', tag: string): void;
    (e: 'remove', tag: string): void;
}>();

const { formatTag } = useProfileTags();
const localNewTag = ref('');

const addNewTag = () => {
    if (!localNewTag.value.trim()) return;

    const formattedTag = formatTag(localNewTag.value);
    emit('add', formattedTag);
    localNewTag.value = '';
};

const removeTag = (tag: string) => {
    emit('remove', tag);
};
</script>