const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    console.log(error);
    
    return res.status(400).json({
      status: 'fail',
      errors: error.errors.map(err => ({
        path: err.path[0],
        message: err.message
      }))
    });
  }
};

module.exports = validate;