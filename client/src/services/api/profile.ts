import type { ProfileFormData } from '@/types/profile';

export const profileApi = {
  async loadProfile(): Promise<ProfileFormData> {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Token non disponible. Veuillez vous connecter.');
    }

    const response = await fetch('/api/auth/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
      throw new Error('Impossible de charger le profil');
    }

    const data = await response.json();
    return {
      username: data.username,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      birthDate: data.birthDate ? new Date(data.birthDate).toISOString().split('T')[0] : '',
      gender: data.gender || '',
      sexualPreference: data.sexualPreference || '',
      location: data.location || '',
      biography: data.biography || '',
      interests: Array.isArray(data.interests) ? data.interests : [],
      profileImageUrl: data.profileImageUrl || '',
      additionalPhotos: data.additionalPhotos || []
    };
  },

  async saveProfile(profileData: ProfileFormData): Promise<void> {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Token non disponible. Veuillez vous reconnecter.');
    }

    const response = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la sauvegarde du profil');
    }
  }
};