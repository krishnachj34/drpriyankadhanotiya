# Dr. Priyanka Dhanotiya - Dermatologist Website

Professional dermatologist website built with **Node.js**, **Express**, **EJS**, and **SQLite**.

## Features

- Modern, responsive design inspired by professional dermatology websites
- Hero section, About, Services (12 treatments), Testimonials, Gallery, Contact
- Appointment booking system with database storage
- Contact form with message storage
- Admin panel to manage all content (doctor info, services, testimonials, gallery, appointments)
- Photo upload support for doctor photo, gallery images, and service images
- Counter animations, smooth scrolling, mobile hamburger menu
- WhatsApp floating button
- SEO-friendly meta tags

## Quick Setup

```bash
# 1. Clone the repository
git clone https://gitlab.com/siratkhoj/priyanka-dhanotiya.git
cd priyanka-dhanotiya

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env

# 4. Seed the database with initial data
npm run seed

# 5. Start the server
npm start
```

Visit **http://localhost:3000** for the website.

## Admin Panel

Visit **http://localhost:3000/admin/login**

- **Username:** admin
- **Password:** admin123

From the admin panel you can:
- Update doctor information and upload photo
- Manage services (add/delete)
- Manage testimonials (add/delete)
- Upload gallery images
- View and manage appointment requests
- View contact form messages

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** SQLite (via better-sqlite3)
- **Templating:** EJS
- **File Uploads:** Multer
- **Security:** Helmet
- **Compression:** compression middleware

## Project Structure

```
├── server.js          # Express server & routes
├── db.js              # Database setup & schema
├── seed.js            # Database seeder
├── package.json
├── .env.example
├── uploads/           # Uploaded images
├── public/
│   ├── css/style.css  # Main stylesheet
│   └── js/script.js   # Frontend JavaScript
└── views/
    ├── index.ejs      # Main website template
    └── admin/
        ├── login.ejs      # Admin login page
        └── dashboard.ejs  # Admin dashboard
```
