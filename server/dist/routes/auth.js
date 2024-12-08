"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../controllers/auth");
const validation_1 = require("../middleware/validation");
const validators_1 = require("../utils/validators");
const router = (0, express_1.Router)();
const registerHandler = async (req, res, next) => {
    try {
        return await auth_1.AuthController.register(req, res);
    }
    catch (error) {
        next(error);
        return;
    }
};
const loginHandler = async (req, res, next) => {
    try {
        return await auth_1.AuthController.login(req, res);
    }
    catch (error) {
        next(error);
        return;
    }
};
router.post('/register', (0, validation_1.validateRequest)(validators_1.registerSchema), async (req, res, next) => {
    try {
        await auth_1.AuthController.register(req, res);
    }
    catch (error) {
        next(error);
    }
});
router.post('/login', (0, validation_1.validateRequest)(validators_1.loginSchema), loginHandler);
exports.default = router;
