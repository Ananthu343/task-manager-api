const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
    try {
        let token;

        // 1. Check if token exists in headers
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            const err = new Error('Not authorized to access this route');
            err.status = 401;
            throw err;
        }

        // 2. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = {
            id: decoded.id,
            tenant_id: decoded.tenant_id
        };

        next();
    } catch (error) {
        error.status = 401;
        error.message = 'Token verification failed';
        next(error);
    }
};

module.exports = { protect };