const User = require('../models/UserModel');

exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(400).json({
                message: 'User not found!'
            });
        }

        res.status(200).json(user);

    } catch (err) {
        console.error(err);
        res.status(400).json({
            message: err
        });
    }
}

exports.updateUser = async (req, res) => {
    const { name, password } = req.body;

    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(400).json({
                message: 'User not found'
            });
        }
    
        if (!name) {
            return res.status(400).json({
                message: 'Name is required'
            }); 
        } else {
            user.name = name;
        }
    
        if (!password || password.length < 6) {
            return res.status(400).json({
                message: 'Password with length or 6 or more characters are required'
            }); 
        } else {
            user.password = password;
        }

        const newUser = await user.save();


        newUser.hashed_password = undefined;
        newUser.salt = undefined;
        res.status(200).json(newUser);

    } catch (err) {
        res.status(400).json({
            error: err.message,
            message: 'User update failed'
        });
    }
}