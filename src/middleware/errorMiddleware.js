

const errorMiddleware = (err, req, res, next) => {
    let statusCode = err.status || 500;
    let message = err.message || 'Internal Server Error';

    if (err.code === '23505') {
        statusCode = 400;
        message = 'Duplicate field value entered';
    }
    console.log(err);

    res.status(statusCode).json({
        status: 'error',
        message: message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
}

module.exports = {
    errorMiddleware
}