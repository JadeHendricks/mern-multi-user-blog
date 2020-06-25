const User = require('../models/UserModel');
const jwt = require('jsonwebtoken');

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });
};

exports.signup  = async (req, res) => {
    const { name, email, password, confirmPassword, photo } = req.body;

    try {
        const newUser = await User.create({
            name, 
            email,
            password,
            confirmPassword,
            photo
        });

        const token = signToken(newUser._id);

        res.status(201).json({
            status: 'ok',
            token,
            user: newUser
        });
    } catch (err) {
        console.error(err.message);
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}

exports.login  = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            status: 'fail',
            message: 'Please provide email and password!'
        })
    }

    try {
        const user = await User.findOne({ email }).select('+password');

        if (!user || !(await user.correctPassword(password, user.password))) {
            return res.status(401).json({
                status: 'fail',
                message: 'Incorrect email or password'
            });
        }
    
        const token = signToken(user._id);
    
        res.status(200).json({
            status: 'ok',
            token,
            user
        });
        
    } catch (error) {
        console.error(err.message);
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}
