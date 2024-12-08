"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileController = void 0;
const Profile_1 = require("../models/Profile");
const validators_1 = require("../utils/validators");
class ProfileController {
    static async updateProfile(req, res) {
        try {
            const validatedData = validators_1.profileSchema.parse(req.body);
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            let profile = await Profile_1.ProfileModel.findByUserId(userId);
            if (!profile) {
                profile = await Profile_1.ProfileModel.create(userId, {
                    ...validatedData,
                    birth_date: new Date(validatedData.birth_date)
                });
            }
            else {
                profile = await Profile_1.ProfileModel.update(userId, {
                    ...validatedData,
                    birth_date: new Date(validatedData.birth_date)
                });
            }
            // Gérer les intérêts
            const currentInterests = await Profile_1.ProfileModel.getInterests(userId);
            const newInterests = validatedData.interests || [];
            // Supprimer les intérêts qui ne sont plus présents
            for (const interest of currentInterests) {
                if (!newInterests.includes(interest)) {
                    await Profile_1.ProfileModel.removeInterest(userId, interest);
                }
            }
            // Ajouter les nouveaux intérêts
            for (const interest of newInterests) {
                if (!currentInterests.includes(interest)) {
                    await Profile_1.ProfileModel.addInterest(userId, interest);
                }
            }
            const updatedInterests = await Profile_1.ProfileModel.getInterests(userId);
            res.json({
                profile: {
                    ...profile,
                    interests: updatedInterests
                }
            });
        }
        catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async getProfile(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const profile = await Profile_1.ProfileModel.findByUserId(userId);
            if (!profile) {
                res.status(404).json({ error: 'Profile not found' });
                return;
            }
            const interests = await Profile_1.ProfileModel.getInterests(userId);
            res.json({
                profile: {
                    ...profile,
                    interests
                }
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.ProfileController = ProfileController;
exports.default = ProfileController;
