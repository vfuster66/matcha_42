// server/src/types/index.ts
export interface User {
	id: string;
	username: string;
	email: string;
	is_verified: boolean;
	created_at: Date;
	last_login: Date | null;
}

export interface Profile {
	user_id: string;
	first_name: string | null;
	last_name: string | null;
	gender: string | null;
	sexual_preferences: string | null;
	biography: string | null;
	birth_date: Date | null;
	latitude: number | null;
	longitude: number | null;
	last_location_update: Date | null;
	fame_rating: number;
	message: string | null;
	is_read: boolean;
}

export interface DatabaseError extends Error {
	code?: string;
	constraint?: string;
}

export interface Photo {
	id: string;
	file_path: string;
	is_primary: boolean;
	created_at: Date;
}

export enum NotificationType {
    LIKE = 'flash',
    PROFILE_VIEW = 'profile_view',
    MESSAGE = 'message',
    MATCH = 'match',
    UNLIKE = 'unflash'
}

export interface Notification {
	id: number;
	recipient_id: number;
	sender_id: number;
	type: NotificationType;
	content: string;
	created_at: Date;
	read: boolean; // Propriété obligatoire
}

