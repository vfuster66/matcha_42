// src/services/photo.ts
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { ProfileModel } from '../models/Profile';

export class PhotoService {
	static async processAndSavePhoto(
		userId: string,
		file: Express.Multer.File,
		isPrimary: boolean = false
	) {
		try {
			// Créer le dossier de destination s'il n'existe pas
			const uploadDir = path.join(process.cwd(), 'uploads', 'profiles');
			await fs.mkdir(uploadDir, { recursive: true });

			// Générer les versions de l'image
			const filename = path.parse(file.filename).name;
			const processedFilename = `${filename}_processed.jpg`;
			const thumbnailFilename = `${filename}_thumb.jpg`;

			// Traiter l'image principale
			await sharp(file.path)
				.resize(800, 800, {
					fit: 'inside',
					withoutEnlargement: true
				})
				.jpeg({ quality: 80 })
				.toFile(path.join(uploadDir, processedFilename));

			// Créer la miniature
			await sharp(file.path)
				.resize(200, 200, {
					fit: 'cover'
				})
				.jpeg({ quality: 70 })
				.toFile(path.join(uploadDir, thumbnailFilename));

			// Supprimer le fichier original
			await fs.unlink(file.path);

			// Sauvegarder dans la base de données
			await ProfileModel.addPhoto(userId, processedFilename, isPrimary);

			// Vérifier le nombre total de photos
			const photos = await ProfileModel.getPhotos(userId);
			if (photos.length > 5) {
				throw new Error('Maximum number of photos reached (5)');
			}
			await ProfileModel.addPhoto(userId, processedFilename, isPrimary);

			return {
				filename: processedFilename,
				thumbnail: thumbnailFilename
			};
		} catch (error) {
			// Nettoyer en cas d'erreur
			if (file.path) {
				await fs.unlink(file.path).catch(() => { });
			}
			throw error;
		}
	}
	static async deletePhoto(userId: string, photoId: string): Promise<void> {
		try {
			// Vérifiez si la photo existe
			const photo = await ProfileModel.getPhotos(userId);
			const photoToDelete = photo.find((p) => p.id === photoId);

			if (!photoToDelete) {
				throw new Error('Photo not found or unauthorized');
			}

			// Supprimez la photo de la base de données
			await ProfileModel.deletePhoto(userId, photoId);

			// Supprimez les fichiers associés
			const uploadDir = path.join(process.cwd(), 'uploads', 'profiles');
			const processedPath = path.join(uploadDir, photoToDelete.file_path);
			const thumbnailPath = path.join(uploadDir, photoToDelete.file_path.replace('_processed', '_thumb'));

			await fs.unlink(processedPath).catch(() => { }); // Ignore errors
			await fs.unlink(thumbnailPath).catch(() => { }); // Ignore errors
		} catch (error) {
			if (error instanceof Error) {
				throw new Error(`Failed to delete photo: ${error.message}`);
			} else {
				throw new Error('Failed to delete photo');
			}
		}
	}

}