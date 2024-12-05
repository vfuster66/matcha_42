"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const profile_1 = require("../controllers/profile");
const upload_1 = require("../config/upload");
const photo_1 = require("../controllers/photo");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Création de wrappers avec le bon typage
const getProfileHandler = async (req, res, next) => {
    try {
        await profile_1.ProfileController.getProfile(req, res);
    }
    catch (error) {
        next(error);
    }
};
const updateProfileHandler = async (req, res, next) => {
    try {
        await profile_1.ProfileController.updateProfile(req, res);
    }
    catch (error) {
        next(error);
    }
};
// Routes
router.get('/', auth_1.authMiddleware, getProfileHandler);
router.put('/', auth_1.authMiddleware, updateProfileHandler);
router.post('/photos', auth_1.authMiddleware, upload_1.uploadConfig.single('photo'), photo_1.PhotoController.uploadPhoto);
router.put('/photos/:photoId/primary', auth_1.authMiddleware, photo_1.PhotoController.setPrimaryPhoto);
router.delete('/photos/:photoId', auth_1.authMiddleware, photo_1.PhotoController.deletePhoto);
exports.default = router;
