let currentUser = null;
let isAuthRegister = false;

document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    fetchPosts();
});

async function checkSession() {
    const res = await fetch('/api/session');
    const data = await res.json();
    const navAuth = document.getElementById('nav-auth');
    const postCard = document.getElementById('create-post-card');

    if (data.loggedIn) {
        currentUser = data.user;
        navAuth.innerHTML = `
            <span>Welcome, <strong>${currentUser.username}</strong></span>
            <button onclick="logout()" style="margin-left: 1rem; background: #dc3545;">Logout</button>
        `;
        postCard.style.display = 'block';
    } else {
        currentUser = null;
        navAuth.innerHTML = `<button onclick="openAuthModal()">Login / Register</button>`;
        postCard.style.display = 'none';
    }
}

async function fetchPosts() {
    const res = await fetch('/api/posts');
    const posts = await res.json();
    renderPosts(posts);
}

function renderPosts(posts) {
    const container = document.getElementById('posts-container');
    container.innerHTML = posts.map(p => {
        const isLiked = currentUser && p.likes.includes(currentUser._id);
        const isAuthor = currentUser && currentUser._id === p.author._id;
        const isFollowing = currentUser && currentUser.following.includes(p.author._id);

        return `
            <div class="card">
                <div class="post-header">
                    <div>
                        <span class="post-author">${p.author.username}</span>
                        ${currentUser && !isAuthor ? `
                            <button onclick="toggleFollow('${p.author._id}')" style="font-size:0.75rem; padding:0.2rem 0.5rem; margin-left:0.5rem; background:${isFollowing ? '#6c757d' : '#1877f2'};">
                                ${isFollowing ? 'Following' : '+ Follow'}
                            </button>
                        ` : ''}
                    </div>
                    <span class="post-time">${new Date(p.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="post-content">${p.content}</div>
                <div class="post-actions">
                    <button class="action-btn ${isLiked ? 'liked' : ''}" onclick="toggleLike('${p._id}')">
                        <i class="fa-solid fa-thumbs-up"></i> ${p.likes.length} Likes
                    </button>
                </div>
                <div class="comments-section">
                    ${p.comments.map(c => `<div class="comment"><strong>${c.username}:</strong>${c.text}</div>`).join('')}
                    ${currentUser ? `
                        <div class="comment-input-box">
                            <input type="text" id="comment-${p._id}" placeholder="Write a comment...">
                            <button onclick="addComment('${p._id}')">Send</button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

async function submitPost() {
    const content = document.getElementById('post-input').value;
    if (!content.trim()) return;

    await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
    });

    document.getElementById('post-input').value = '';
    fetchPosts();
}

async function toggleLike(postId) {
    if (!currentUser) return openAuthModal();
    await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
    fetchPosts();
}

async function addComment(postId) {
    const input = document.getElementById(`comment-${postId}`);
    if (!input.value.trim()) return;

    await fetch(`/api/posts/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input.value })
    });

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
    isAuthRegister = !isAuthRegister;
    document.getElementById('modal-title').innerText = isAuthRegister ? 'Register' : 'Log In';
    document.getElementById('toggle-auth-link').innerText = isAuthRegister ? 'Already have an account? Log In' : "Don't have an account? Register";
}

async function handleAuth() {
    const username = document.getElementById('auth-username').value;
    const password = document.getElementById('auth-password').value;
    const endpoint = isAuthRegister ? '/api/register' : '/api/login';

    const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (res.ok) {
        closeAuthModal();
        checkSession();
        fetchPosts();
    } else {
        alert(data.error);
    }
}

async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    checkSession();
    fetchPosts();
}