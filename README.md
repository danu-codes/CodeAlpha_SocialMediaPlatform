# ⚡ Pulse — Mini Social Media Platform

> A full-stack, mobile-responsive social platform built for **CodeAlpha Task 2** (Full Stack Web Development Internship).

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v4.x-blue.svg)](https://expressjs.com/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas_Cloud-47A248.svg)](https://www.mongodb.com/cloud/atlas)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

---

## 📖 Overview

**Pulse** is a modern, lightweight social platform inspired by platforms like Twitter/X and LinkedIn. It provides seamless user authentication, real-time feed updates, interactive post engagement (likes & comments), post ownership management (editing & deleting), and dynamic user profiles with live follower analytics.

---

## ✨ Key Features

* 🔐 **User Authentication:** Secure user registration, password hashing (`bcryptjs`), and persistent server sessions.
* 📝 **Post Management:** Create, read, edit, and delete your own feed posts with dynamic post-length tracking.
* ❤️ **Interactive Engagement:** Real-time like toggle system and interactive comment sections under each post.
* 👥 **Social Network:** Dynamic user profile cards with real-time **Followers** and **Following** metric counters.
* 📱 **Mobile-First Responsive UI:** Custom off-canvas profile drawer, slide-out views, and modal overlays optimized for desktop, tablet, and mobile displays.
* ☁️ **Cloud Database:** Integrated directly with **MongoDB Atlas** for serverless, zero-local setup storage.

---

## 🛠️ Tech Stack & Architecture

### **Frontend**
* **HTML5 & CSS3:** Semantic elements, CSS variables (`:root`), Flexbox, CSS Grid, and custom animations.
* **JavaScript (ES6+):** Async/Await Fetch API, modular state handlers, DOM manipulation.
* **Icons:** [FontAwesome 6.4](https://fontawesome.com/)

### **Backend**
* **Node.js & Express.js:** RESTful API architecture, JSON body parsing, and route authorization middleware.
* **MongoDB & Mongoose:** Schema modeling, populate utilities, and document indexing.
* **Security & Auth:** `bcryptjs` (Password hashing), `express-session` (Session management).

---

## 📂 Project Structure

```text
CodeAlpha_SocialMediaPlatform/
├── public/
│   ├── index.html        # Primary Single Page Application (SPA) structure
│   ├── styles.css        # Unified responsive stylesheet & design system
│   └── app.js            # Frontend DOM scripts & API requests
├── server.js             # Express server, REST endpoints, & Mongoose models
├── package.json          # Project dependencies and script runner
└── README.md             # Project documentation