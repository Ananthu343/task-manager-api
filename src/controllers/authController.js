const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res, next) => {
  try {
    const { email, password, tenant_id, role } = req.body;

    // 1. Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // 2. Save to DB
    const newUser = await User.create({ tenant_id, email, password_hash, role });

    // 3. Generate JWT
    const token = jwt.sign({ id: newUser.id, tenant_id: newUser.tenant_id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    res.status(201).json({ status: 'success', token, data: { user: newUser } });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      const err = new Error('Invalid email or password');
      err.status = 401;
      throw err;
    }

    const token = jwt.sign({ id: user.id, tenant_id: user.tenant_id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    res.status(200).json({ status: 'success', token });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login };