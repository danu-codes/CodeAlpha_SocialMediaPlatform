let currentUser = null;
let isRegisterMode = false;

document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    fetchPosts();

    const postInput = document.getElementById('post-input');
    if (postInput) {
        postInput.addEventListener('input', (e) => {
            document.getElementById('char-counter').innerText = `${e.target.value.length} / 280`;
        });
    }
});

async function checkSession() {
    try {
        const res = await fetch('/api/session');
        const data = await res.json();
        const actionsContainer = document.getElementById('nav-user-actions');
        const postBox = document.getElementById('create-post-card');

        if (data.loggedIn) {
            currentUser = data.user;
            actionsContainer.innerHTML = `
                <span style="font-size:0.9rem; font-weight:600;"><i class="fa-solid fa-user-circle"></i> ${currentUser.username}</span>
                <button class="btn btn-outline" onclick="logout()">Logout</button>
            `;
            postBox.style.display = 'block';

            document.getElementById('sidebar-username').innerText = currentUser.username;
            document.getElementById('sidebar-bio').innerText = `${currentUser.following.length} Following`;
            document.getElementById('sidebar-action-btn').style.display = 'none';
        } else {
            currentUser = null;
            actionsContainer.innerHTML = `<button class="btn btn-primary" onclick="openAuthModal()">Sign In</button>`;
            postBox.style.display = 'none';

            document.getElementById('sidebar-username').innerText = 'Guest User';
            document.getElementById('sidebar-bio').innerText = 'Sign in to publish posts and interact with the stream.';
            document.getElementById('sidebar-action-btn').style.display = 'inline-block';
        }
    } catch (err) {
        console.error('Session error:', err);
    }
}

async function fetchPosts() {
    try {
        const res = await fetch('/api/posts');
        const posts = await res.json();
        renderPosts(posts);
    } catch (err) {
        showToast('Failed to load feed');
    }
}

function renderPosts(posts) {
    const container = document.getElementById('posts-feed-container');
    if (posts.length === 0) {
        container.innerHTML = `<div class="card" style="text-align:center; color: var(--text-muted);">No posts available. Be the first to share!</div>`;
        return;
    }

    container.innerHTML = posts.map(p => {
        const isLiked = currentUser && p.likes.includes(currentUser._id);
        const isAuthor = currentUser && currentUser._id === p.author._id;
        const isFollowing = currentUser && currentUser.following.includes(p.author._id);

        return `
            <div class="card">
                <div class="post-card-header">
                    <div class="post-user-info">
                        <div class="avatar-placeholder">${p.author.username.charAt(0).toUpperCase()}</div>
                        <div>
                            <div class="post-username">${p.author.username}</div>
                            <div class="post-time">${new Date(p.createdAt).toLocaleDateString()}</div>
                        </div>
                    </div>
                    ${currentUser && !isAuthor ? `
                        <button class="btn btn-outline" style="padding:0.25rem 0.75rem; font-size:0.75rem;" onclick="toggleFollow('${p.author._id}')">
                            ${isFollowing ? 'Following' : '+ Follow'}
                        </button>
                    ` : ''}
                </div>
                <div class="post-body">${p.content}</div>
                <div class="post-actions">
                    <button class="action-btn ${isLiked ? 'active' : ''}" onclick="toggleLike('${p._id}')">
                        <i class="fa-${isLiked ? 'solid' : 'regular'} fa-heart"></i> ${p.likes.length}
                    </button>
                    <button class="action-btn">
                        <i class="fa-regular fa-comment"></i> ${p.comments.length}
                    </button>
                </div>
                <div class="comments-container">
                    ${p.comments.map(c => `
                        <div class="comment-item">
                            <span class="comment-author">${c.username}:</span>
                            <span>${c.text}</span>
                        </div>
                    `).join('')}
                    ${currentUser ? `
                        <form class="comment-form" onsubmit="addComment(event, '${p._id}')">
                            <input type="text" id="comment-input-${p._id}" placeholder="Write a comment..." required>
                            <button type="submit" class="btn btn-primary" style="padding:0.3rem 0.8rem; font-size:0.78rem;">Reply</button>
                        </form>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

async function submitPost() {
    const input = document.getElementById('post-input');
    if (!input.value.trim()) return showToast('Post content cannot be empty!');

    const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input.value })
    });

    if (res.ok) {
        input.value = '';
        document.getElementById('char-counter').innerText = '0 / 280';
        showToast('Published to feed!');
        fetchPosts();
    }
}

async function toggleLike(postId) {
    if (!currentUser) return openAuthModal();
    await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
    fetchPosts();
}

async function addComment(e, postId) {
    e.preventDefault();
    const input = document.getElementById(`comment-input-${postId}`);
    if (!input.value.trim()) return;

    await fetch(`/api/posts/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input.value })
    });

    input.value = '';
    fetchPosts();
}

async function toggleFollow(userId) {
    await fetch(`/api/users/${userId}/follow`, { method: 'POST' });
    checkSession();
    fetchPosts();
}

// Auth Handlers
function openAuthModal() { document.getElementById('auth-modal').classList.add('active'); }
function closeAuthModal() { document.getElementById('auth-modal').classList.remove('active'); }

function toggleAuthMode() {
    isRegisterMode = !isRegisterMode;
    document.getElementById('modal-title').innerText = isRegisterMode ? 'Create Account' : 'Welcome Back';
    document.getElementById('modal-subtitle').innerText = isRegisterMode ? 'Join Pulse Social today' : 'Log in to access your Pulse profile';
    document.getElementById('auth-submit-btn').innerText = isRegisterMode ? 'Sign Up' : 'Log In';
    document.getElementById('auth-toggle-link').innerText = isRegisterMode ? 'Already have an account? Log In' : 'New to Pulse? Create an account';
}

async function handleAuth(e) {
    e.preventDefault();
    const username = document.getElementById('auth-username').value;
    const password = document.getElementById('auth-password').value;
    const endpoint = isRegisterMode ? '/api/register' : '/api/login';

    const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (res.ok) {
        showToast(data.message);
        closeAuthModal();
        checkSession();
        fetchPosts();
    } else {
        showToast(data.error || 'Authentication failed');
    }
}

async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    showToast('Logged out');
    checkSession();
    fetchPosts();
}

function showToast(msg) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}