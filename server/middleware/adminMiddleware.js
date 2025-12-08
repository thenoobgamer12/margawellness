import authMiddleware from './authMiddleware.js';

const adminMiddleware = (req, res, next) => {
    authMiddleware(req, res, () => {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Access denied. Admin role required.' });
        }
        next();
    });
};

export default adminMiddleware;
