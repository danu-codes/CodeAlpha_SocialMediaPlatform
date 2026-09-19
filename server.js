const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());
app.use(express.static('public'));

app.use(session({
    secret: 'social_media_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/social_media_db')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Database Schemas
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    bio: { type: String, default: 'Hello! I am using CodeAlpha Social.' },
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

const PostSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        username: String,
        text: String,
        createdAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Post = mongoose.model('Post', PostSchema);

// Auth Middleware
function requireAuth(req, res, next) {
    if (!req.session.userId) return res.status(401).json({ error: 'Please log in' });
    next();
}

// Auth Endpoints
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword });
        await user.save();
        req.session.userId = user._id;
        res.json({ message: 'Registration successful!', user: { id: user._id, username: user.username } });
    } catch (err) {
        res.status(400).json({ error: 'Username already taken or invalid' });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
        req.session.userId = user._id;
        return res.json({ message: 'Logged in successfully', user: { id: user._id, username: user.username } });
    }
    res.status(400).json({ error: 'Invalid credentials' });
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logged out' });
});

app.get('/api/session', async (req, res) => {
    if (!req.session.userId) return res.json({ loggedIn: false });
    const user = await User.findById(req.session.userId).populate('following', 'username');
    res.json({ loggedIn: true, user });
});

// Post Endpoints
app.get('/api/posts', async (req, res) => {
    const posts = await Post.find()
        .populate('author', 'username')
        .sort({ createdAt: -1 });
    res.json(posts);
});

app.post('/api/posts', requireAuth, async (req, res) => {
    const post = new Post({
        author: req.session.userId,
        content: req.body.content
    });
    await post.save();
    await post.populate('author', 'username');
    res.json(post);
});

// Like / Unlike Post
app.post('/api/posts/:id/like', requireAuth, async (req, res) => {
    const post = await Post.findById(req.params.id);
    const userId = req.session.userId;
    const likedIndex = post.likes.indexOf(userId);

    if (likedIndex === -1) {
        post.likes.push(userId);
    } else {
        post.likes.splice(likedIndex, 1);
    }
    await post.save();
    res.json(post);
});

// Comment on Post
app.post('/api/posts/:id/comment', requireAuth, async (req, res) => {
    const post = await Post.findById(req.params.id);
    const user = await User.findById(req.session.userId);
    
    post.comments.push({
        user: user._id,
        username: user.username,
        text: req.body.text
    });
    await post.save();
    res.json(post);
});

// Follow / Unfollow User
app.post('/api/users/:id/follow', requireAuth, async (req, res) => {
    const currentUser = await User.findById(req.session.userId);
    const targetUserId = req.params.id;

    if (currentUser._id.toString() === targetUserId) {
        return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    const followIndex = currentUser.following.indexOf(targetUserId);
    if (followIndex === -1) {
        currentUser.following.push(targetUserId);
    } else {
        currentUser.following.splice(followIndex, 1);
    }
    await currentUser.save();
    res.json({ following: currentUser.following });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));