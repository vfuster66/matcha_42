export interface ProfileFormData {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    gender: string;
    sexualPreference: string;
    location: string;
    biography: string;
    interests: string[];
    profileImageUrl: string;
    additionalPhotos: (string | null)[];
  }
  
  export interface ProfilePhotoRef {
    [key: string]: HTMLInputElement | null;
  }