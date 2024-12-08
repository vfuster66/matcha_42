"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.validateRequest = void 0;
const validateRequest = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.parseAsync(req.body);
            next();
        }
        catch (error) {
            res.status(400).json({
                status: 'error',
                errors: error.errors || [{ message: 'Validation failed' }]
            });
        }
    };
};
exports.validateRequest = validateRequest;
const errorHandler = (error, req, res, next) => {
    if (error.name === 'ValidationError') {
        res.status(400).json({
            status: 'error',
            errors: error.errors
        });
        return;
    }
    console.error(error);
    res.status(500).json({
        status: 'error',
        message: 'Internal server error'
    });
};
exports.errorHandler = errorHandler;
