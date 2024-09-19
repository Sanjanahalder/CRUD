const express = require('express');
const router = express.Router();
const User = require('../models/users');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Image upload configuration
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads')); // Ensure this path exists or handle directory creation
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    }
});

var upload = multer({
    storage: storage,
}).single('image');

// Insert a user into the database route
router.post('/add', upload, async (req, res) => {
    try {
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            image: req.file ? req.file.filename : null, // Check if file exists
        });

        await user.save();

        req.session.message = {
            type: 'success',
            message: 'User added successfully',
        };
        res.redirect("/");
    } catch (err) {
        req.session.message = {
            type: 'danger',
            message: 'Error adding user: ' + err.message,
        };
        res.redirect("/add");
    }
});

// Get all users route
router.get('/', async (req, res) => {
    try {
        const users = await User.find(); // Fetch all users from DB
        res.render('main', {
            title: 'Home Page',
            users: users,
        });
    } catch (err) {
        res.json({ message: err.message, type: 'danger' });
    }
});

// Render the form to add users
router.get('/add', (req, res) => {
    res.render('add_users', { title: 'Add Users' });
});

// Edit a user route
router.get('/edit/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            req.session.message = {
                type: 'danger',
                message: 'User not found',
            };
            return res.redirect('/');
        }
        res.render('edit_users', {
            title: 'Edit User',
            user: user,
        });
    } catch (err) {
        req.session.message = {
            type: 'danger',
            message: 'Error fetching user: ' + err.message,
        };
        res.redirect('/');
    }
});

// Update a user route
router.post('/update/:id', upload, async (req, res) => {
    const id = req.params.id;
    let newImage = '';

    try {
        // Handle image file
        if (req.file) {
            newImage = req.file.filename;
            // Remove the old image if it exists
            if (req.body.old_image) {
                fs.unlinkSync(path.join(__dirname, '../uploads', req.body.old_image));
            }
        } else {
            newImage = req.body.old_image;
        }

        // Update user
        await User.findByIdAndUpdate(id, {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            image: newImage,
        });

        req.session.message = {
            type: 'success',
            message: 'User updated successfully',
        };
        res.redirect("/");
    } catch (err) {
        req.session.message = {
            type: 'danger',
            message: 'Error updating user: ' + err.message,
        };
        res.redirect(`/edit/${id}`);
    }
});

//Delete user Route 
router.get("/delete/:id", async (req, res) => {
    let id = req.params.id;

    try {
        const result = await User.findByIdAndDelete(id); // Find and delete the user

        if (result && result.image) { // Check if the image exists in the result
            const imagePath = path.join(__dirname, "../uploads", result.image); // Create absolute path to the image
            
            try {
                fs.unlinkSync(imagePath); // Attempt to delete the image file
            } catch (err) {
                console.log("Error deleting image file: ", err);
            }
        }

        req.session.message = {
            type: 'success',
            message: 'User deleted successfully',
        };
        res.redirect('/');
    } catch (err) {
        req.session.message = {
            type: 'danger',
            message: 'Error deleting user: ' + err.message,
        };
        res.redirect('/');
    }
});


module.exports = router;
