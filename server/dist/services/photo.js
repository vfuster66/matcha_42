"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhotoService = void 0;
// src/services/photo.ts
const sharp_1 = __importDefault(require("sharp"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const Profile_1 = require("../models/Profile");
class PhotoService {
    static async processAndSavePhoto(userId, file, isPrimary = false) {
        try {
            // Vérifier la limite de photos avant traitement
            const photos = await Profile_1.ProfileModel.getPhotos(userId);
            if (photos.length >= 5) {
                throw new Error('Maximum number of photos reached (5)');
            }
            // Créer le dossier de destination s'il n'existe pas
            const uploadDir = path_1.default.join(process.cwd(), 'uploads', 'profiles');
            await promises_1.default.mkdir(uploadDir, { recursive: true });
            // Générer les versions de l'image
            const filename = path_1.default.parse(file.filename).name;
            const processedFilename = `${filename}_processed.jpg`;
            const thumbnailFilename = `${filename}_thumb.jpg`;
            // Traiter l'image principale
            await (0, sharp_1.default)(file.path)
                .resize(800, 800, {
                fit: 'inside',
                withoutEnlargement: true
            })
                .jpeg({ quality: 80 })
                .toFile(path_1.default.join(uploadDir, processedFilename));
            // Créer la miniature
            await (0, sharp_1.default)(file.path)
                .resize(200, 200, {
                fit: 'cover'
            })
                .jpeg({ quality: 70 })
                .toFile(path_1.default.join(uploadDir, thumbnailFilename));
            // Supprimer le fichier original
            await promises_1.default.unlink(file.path);
            // Si c'est la première photo, la définir comme photo de profil
            if (photos.length === 0) {
                isPrimary = true;
            }
            // Sauvegarder dans la base de données
            await Profile_1.ProfileModel.addPhoto(userId, processedFilename, isPrimary);
            return {
                filename: processedFilename,
                thumbnail: thumbnailFilename,
                isPrimary
            };
        }
        catch (error) {
            // Nettoyer en cas d'erreur
            if (file.path) {
                await promises_1.default.unlink(file.path).catch(() => { });
            }
            throw error;
        }
    }
    static async deletePhoto(userId, photoId) {
        try {
            // Vérifiez si la photo existe
            const photo = await Profile_1.ProfileModel.getPhotos(userId);
            const photoToDelete = photo.find((p) => p.id === photoId);
            if (!photoToDelete) {
                throw new Error('Photo not found or unauthorized');
            }
            // Supprimez la photo de la base de données
            await Profile_1.ProfileModel.deletePhoto(userId, photoId);
            // Supprimez les fichiers associés
            const uploadDir = path_1.default.join(process.cwd(), 'uploads', 'profiles');
            const processedPath = path_1.default.join(uploadDir, photoToDelete.file_path);
            const thumbnailPath = path_1.default.join(uploadDir, photoToDelete.file_path.replace('_processed', '_thumb'));
            await promises_1.default.unlink(processedPath).catch(() => { }); // Ignore errors
            await promises_1.default.unlink(thumbnailPath).catch(() => { }); // Ignore errors
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to delete photo: ${error.message}`);
            }
            else {
                throw new Error('Failed to delete photo');
            }
        }
    }
    static async validatePhotoLimit(userId) {
        const photos = await Profile_1.ProfileModel.getPhotos(userId);
        if (photos.length >= 5) {
            throw new Error('Maximum number of photos (5) reached');
        }
        return true;
    }
    static async hasProfilePicture(userId) {
        const photos = await Profile_1.ProfileModel.getPhotos(userId);
        return photos.some(photo => photo.is_primary);
    }
}
exports.PhotoService = PhotoService;
