"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// server/src/routes/auth.ts
const express_1 = require("express");
const auth_1 = require("../controllers/auth");
const router = (0, express_1.Router)();
// Création de wrappers avec le bon typage
const registerHandler = async (req, res, next) => {
    try {
        await auth_1.AuthController.register(req, res);
    }
    catch (error) {
        next(error);
    }
};
const loginHandler = async (req, res, next) => {
    try {
        await auth_1.AuthController.login(req, res);
    }
    catch (error) {
        next(error);
    }
};
// Utilisation des wrappers comme handlers de route
router.post('/register', registerHandler);
router.post('/login', loginHandler);
exports.default = router;
