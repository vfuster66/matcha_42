import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { RequestHandler } from 'express';

export const validateRequest = (schema: ZodSchema): RequestHandler => {
   return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
       try {
           await schema.parseAsync(req.body);
           next();
       } catch (error: any) {
           res.status(400).json({
               status: 'error',
               errors: error.errors || [{ message: 'Validation failed' }]
           });
       }
   };
};

export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction): void => {
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