import { defineStore } from 'pinia';

interface User {
  id: number;
  name: string;
  email: string;
}

export const useMainStore = defineStore('main', {
  state: () => ({
    user: null as User | null,
  }),
  actions: {
    setUser(user: User) {
      this.user = user;
    },
  },
});
