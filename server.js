const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());
app.use(express.static('public'));

app.use(session({
    secret: 'codealpha_pulse_secret_2026',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// MongoDB Atlas Cloud Connection (No local MongoDB software needed)
const MONGO_URI = 'mongodb+srv://dstarlord07_db_user:8tBa9odhelwzZRoa@cluster0.sh3yc2s.mongodb.net/?appName=Cluster0';

mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB Atlas Cloud Database!'))
    .catch(err => console.error('MongoDB Atlas Connection Error:', err));

// --- Schemas & Models ---
const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}));

const Post = mongoose.model('Post', new mongoose.Schema({
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
}));

// --- Middleware ---
function requireAuth(req, res, next) {
    if (!req.session.userId) return res.status(401).json({ error: 'Authentication required' });
    next();
}

// --- Routes ---
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword });
        await user.save();
        req.session.userId = user._id;
        res.status(201).json({ message: 'Account created successfully', user });
    } catch (err) {
        res.status(400).json({ error: 'Username already taken' });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
        req.session.userId = user._id;
        return res.json({ message: 'Welcome back!', user });
    }
    res.status(400).json({ error: 'Invalid username or password' });
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Session terminated' });
});

app.get('/api/session', async (req, res) => {
    if (!req.session.userId) return res.json({ loggedIn: false });
    const user = await User.findById(req.session.userId).select('-password');
    res.json({ loggedIn: true, user });
});

app.get('/api/posts', async (req, res) => {
    const posts = await Post.find().populate('author', 'username').sort({ createdAt: -1 });
    res.json(posts);
});

app.post('/api/posts', requireAuth, async (req, res) => {
    const post = new Post({ author: req.session.userId, content: req.body.content });
    await post.save();
    res.status(201).json(post);
});

app.post('/api/posts/:id/like', requireAuth, async (req, res) => {
    const post = await Post.findById(req.params.id);
    const index = post.likes.indexOf(req.session.userId);
    if (index === -1) post.likes.push(req.session.userId);
    else post.likes.splice(index, 1);
    await post.save();
    res.json(post);
});

app.post('/api/posts/:id/comment', requireAuth, async (req, res) => {
    const post = await Post.findById(req.params.id);
    const user = await User.findById(req.session.userId);
    post.comments.push({ user: user._id, username: user.username, text: req.body.text });
    await post.save();
    res.json(post);
});

app.post('/api/users/:id/follow', requireAuth, async (req, res) => {
    const currentUser = await User.findById(req.session.userId);
    const targetId = req.params.id;
    if (currentUser._id.toString() === targetId) return res.status(400).json({ error: 'Cannot follow yourself' });

    const index = currentUser.following.indexOf(targetId);
    if (index === -1) currentUser.following.push(targetId);
    else currentUser.following.splice(index, 1);
    await currentUser.save();
    res.json(currentUser);
});

// Get Session with Live Profile Stats
app.get('/api/session', async (req, res) => {
    if (!req.session.userId) return res.json({ loggedIn: false });
    
    const user = await User.findById(req.session.userId).select('-password');
    if (!user) return res.json({ loggedIn: false });

    // Calculate actual followers count
    const followersCount = await User.countDocuments({ following: user._id });

    res.json({
        loggedIn: true,
        user: {
            ...user.toObject(),
            followersCount
        }
    });
});

// Edit Post Route (Author Only)
app.put('/api/posts/:id', requireAuth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        
        if (post.author.toString() !== req.session.userId) {
            return res.status(403).json({ error: 'Unauthorized action' });
        }

        post.content = req.body.content;
        await post.save();
        res.json(post);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update post' });
    }
});

// Delete Post Route (Author Only)
app.delete('/api/posts/:id', requireAuth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ error: 'Post not found' });

        if (post.author.toString() !== req.session.userId) {
            return res.status(403).json({ error: 'Unauthorized action' });
        }

        await Post.findByIdAndDelete(req.params.id);
        res.json({ message: 'Post deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));