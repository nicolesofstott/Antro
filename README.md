# Antro

A web-based VR art platform empowering emerging artists through immersive galleries and professional portfolios.

# Overview

Antro is an interactive multi-user web platform that allows verified artists to upload and showcase their artworks in immersive VR galleries. Built with a strong emphasis on accessibility, emotional engagement, and design psychology, Antro democratizes the art world by offering virtual exhibition spaces, artist portfolios, and direct access to curatorial opportunities.

# Features

- Artist Portfolio Uploads: Upload artworks (with dimensions, title, description, multiple images), CV, and portfolio files.
- VR Gallery Creation: Curate your own virtual gallery space using selected artworks and customizable frame styles.
- Artist Verification: Users with institutional emails (e.g., @arts.ac.uk) are auto-verified as artists.
- Smart Search: Find profiles, artworks, and galleries using categorized search with debounce and caching.
- Secure File Handling: Uploads are stored and organized per user and file type (artworks, CVs, portfolios).
- Three.js + A-Frame Integration: VR galleries rendered dynamically based on real artwork dimensions and metadata.
  
# Tech Stack

Frontend: HTML, CSS, JavaScript
Backend: Node.js, Express.js
Database: MongoDB + Mongoose
VR Rendering: A-Frame, Three.js
File Uploads: Multer
Authentication: JWT
Deployment-ready: Modular file and folder structure for long-term scalability
Getting Started

# Prerequisites
Node.js + npm
MongoDB (local or cloud)

# Installation

# Clone the repo
git clone https://github.com/yourusername/antro.git
cd antro
# Install dependencies
npm install
# Create a .env file in the back-end directory with:
MONGO_URI=your_mongo_connection_string
JWT_SECRET=your_secret_key
# Start the backend
cd back-end
node server.js
# Open http://localhost:5050/index.html

# Folder Structure 
antro/
├── front-end/
│   ├── index.html
│   ├── create.html
│   ├── profile.html
│   └── js/
│       ├── antro.js
│       ├── create.js
│       └── profilescript.js
├── back-end/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── uploads/
│   └── server.js

Developed by Nicole Stott as part of the final graduation thesis for Creative Computing.
Design decisions backed by UX research, VR immersion literature, and behavioural science insights.
