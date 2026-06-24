require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const helmet = require('helmet');
const compression = require('compression');
const multer = require('multer');
const nodemailer = require('nodemailer');
const slugify = require('slugify');
const { initDB, getOne, getAll, runQuery } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Email transporter
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}

async function sendNotification(subject, html) {
  if (!transporter || !process.env.NOTIFY_EMAIL) return;
  try {
    await transporter.sendMail({ from: process.env.SMTP_USER, to: process.env.NOTIFY_EMAIL, subject, html });
  } catch (err) { console.error('Email error:', err.message); }
}

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  }
});

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use((req, res, next) => {
  res.locals.isAdmin = req.session && req.session.isAdmin;
  res.locals.whatsappNumber = process.env.WHATSAPP_NUMBER || '';
  res.locals.siteUrl = process.env.SITE_URL || 'http://localhost:3000';
  next();
});

// ==================== SEO ====================
app.get('/sitemap.xml', (req, res) => {
  const baseUrl = process.env.SITE_URL || 'http://localhost:3000';
  const blogs = getAll('SELECT slug, updated_at FROM blogs WHERE is_published = 1');
  let xml = '<?xml version="1.0" encoding="UTF-8"?>';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  xml += `<url><loc>${baseUrl}/</loc><priority>1.0</priority><changefreq>weekly</changefreq></url>`;
  xml += `<url><loc>${baseUrl}/blog</loc><priority>0.8</priority><changefreq>weekly</changefreq></url>`;
  blogs.forEach(b => {
    xml += `<url><loc>${baseUrl}/blog/${b.slug}</loc><lastmod>${b.updated_at}</lastmod><priority>0.7</priority></url>`;
  });
  xml += '</urlset>';
  res.header('Content-Type', 'application/xml');
  res.send(xml);
});

app.get('/robots.txt', (req, res) => {
  const baseUrl = process.env.SITE_URL || 'http://localhost:3000';
  res.type('text/plain');
  res.send(`User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml`);
});

// ==================== PUBLIC ROUTES ====================
app.get('/', (req, res) => {
  const doctor = getOne('SELECT * FROM doctor WHERE id = 1');
  const services = getAll('SELECT * FROM services WHERE is_active = 1 ORDER BY sort_order');
  const testimonials = getAll('SELECT * FROM testimonials WHERE is_active = 1 ORDER BY created_at DESC LIMIT 6');
  const gallery = getAll('SELECT * FROM gallery WHERE is_active = 1 ORDER BY sort_order');
  const stats = getAll('SELECT * FROM stats ORDER BY sort_order');
  const faqs = getAll('SELECT * FROM faqs WHERE is_active = 1 ORDER BY sort_order');
  const beforeAfter = getAll('SELECT * FROM before_after WHERE is_active = 1 ORDER BY sort_order');
  const blogs = getAll('SELECT * FROM blogs WHERE is_published = 1 ORDER BY created_at DESC LIMIT 3');
  res.render('index', { doctor, services, testimonials, gallery, stats, faqs, beforeAfter, blogs });
});

app.get('/blog', (req, res) => {
  const doctor = getOne('SELECT * FROM doctor WHERE id = 1');
  const blogs = getAll('SELECT * FROM blogs WHERE is_published = 1 ORDER BY created_at DESC');
  res.render('blog', { doctor, blogs });
});

app.get('/blog/:slug', (req, res) => {
  const doctor = getOne('SELECT * FROM doctor WHERE id = 1');
  const blog = getOne('SELECT * FROM blogs WHERE slug = ? AND is_published = 1', [req.params.slug]);
  if (!blog) return res.status(404).render('404', { doctor });
  const recentBlogs = getAll('SELECT * FROM blogs WHERE is_published = 1 AND id != ? ORDER BY created_at DESC LIMIT 3', [blog.id]);
  res.render('blog-single', { doctor, blog, recentBlogs });
});

app.post('/api/appointments', async (req, res) => {
  const { name, email, phone, date, time, service, message } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'Name and phone are required' });
  try {
    runQuery('INSERT INTO appointments (name, email, phone, preferred_date, preferred_time, service, message) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email || '', phone, date || '', time || '', service || '', message || '']);
    await sendNotification(`New Appointment: ${name}`,
      `<h2>New Appointment Request</h2><p><strong>Name:</strong> ${name}</p><p><strong>Phone:</strong> ${phone}</p><p><strong>Email:</strong> ${email || 'N/A'}</p><p><strong>Service:</strong> ${service || 'N/A'}</p><p><strong>Date:</strong> ${date || 'N/A'}</p><p><strong>Time:</strong> ${time || 'N/A'}</p><p><strong>Message:</strong> ${message || 'N/A'}</p>`);
    res.json({ success: true, message: 'Appointment request submitted successfully!' });
  } catch (err) { res.status(500).json({ error: 'Failed to submit appointment' }); }
});

app.post('/api/contact', async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !message) return res.status(400).json({ error: 'Name and message are required' });
  try {
    runQuery('INSERT INTO contacts (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)',
      [name, email || '', phone || '', subject || '', message]);
    await sendNotification(`New Contact: ${subject || 'Website Inquiry'}`,
      `<h2>New Contact Message</h2><p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email || 'N/A'}</p><p><strong>Phone:</strong> ${phone || 'N/A'}</p><p><strong>Subject:</strong> ${subject || 'N/A'}</p><p><strong>Message:</strong> ${message}</p>`);
    res.json({ success: true, message: 'Message sent successfully!' });
  } catch (err) { res.status(500).json({ error: 'Failed to send message' }); }
});

// ==================== ADMIN ====================
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  res.redirect('/admin/login');
}

app.get('/admin/login', (req, res) => res.render('admin/login', { error: null }));

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === (process.env.ADMIN_USERNAME || 'admin') && password === (process.env.ADMIN_PASSWORD || 'admin123')) {
    req.session.isAdmin = true;
    return res.redirect('/admin');
  }
  res.render('admin/login', { error: 'Invalid credentials' });
});

app.get('/admin/logout', (req, res) => { req.session.destroy(); res.redirect('/'); });

app.get('/admin', requireAdmin, (req, res) => {
  const appointments = getAll('SELECT * FROM appointments ORDER BY created_at DESC');
  const contacts = getAll('SELECT * FROM contacts ORDER BY created_at DESC');
  const services = getAll('SELECT * FROM services ORDER BY sort_order');
  const testimonials = getAll('SELECT * FROM testimonials ORDER BY created_at DESC');
  const gallery = getAll('SELECT * FROM gallery ORDER BY sort_order');
  const doctor = getOne('SELECT * FROM doctor WHERE id = 1');
  const stats = getAll('SELECT * FROM stats ORDER BY sort_order');
  const blogs = getAll('SELECT * FROM blogs ORDER BY created_at DESC');
  const faqs = getAll('SELECT * FROM faqs ORDER BY sort_order');
  const beforeAfter = getAll('SELECT * FROM before_after ORDER BY sort_order');
  const offlinePatients = getAll('SELECT * FROM offline_patients ORDER BY created_at DESC');
  res.render('admin/dashboard', { appointments, contacts, services, testimonials, gallery, doctor, stats, blogs, faqs, beforeAfter, offlinePatients });
});

app.post('/admin/doctor', requireAdmin, upload.single('photo'), (req, res) => {
  const { name, qualifications, specialization, about, experience_years, clinic_name, clinic_address, phone, email, working_hours, map_embed, whatsapp } = req.body;
  let photo = req.body.existing_photo || '';
  if (req.file) photo = '/uploads/' + req.file.filename;
  runQuery('UPDATE doctor SET name=?, qualifications=?, specialization=?, about=?, experience_years=?, clinic_name=?, clinic_address=?, phone=?, email=?, working_hours=?, map_embed=?, photo=?, whatsapp=? WHERE id=1',
    [name, qualifications, specialization, about, experience_years, clinic_name, clinic_address, phone, email, working_hours, map_embed, photo, whatsapp || '']);
  res.redirect('/admin');
});

app.post('/admin/services', requireAdmin, upload.single('image'), (req, res) => {
  const { title, description, icon, sort_order, price } = req.body;
  let image = '';
  if (req.file) image = '/uploads/' + req.file.filename;
  runQuery('INSERT INTO services (title, description, icon, image, sort_order, price) VALUES (?, ?, ?, ?, ?, ?)',
    [title, description, icon || 'fa-stethoscope', image, sort_order || 0, price || '']);
  res.redirect('/admin');
});

app.post('/admin/services/:id/delete', requireAdmin, (req, res) => {
  runQuery('DELETE FROM services WHERE id = ?', [parseInt(req.params.id)]);
  res.redirect('/admin');
});

app.post('/admin/testimonials', requireAdmin, (req, res) => {
  const { patient_name, rating, review, treatment } = req.body;
  runQuery('INSERT INTO testimonials (patient_name, rating, review, treatment) VALUES (?, ?, ?, ?)',
    [patient_name, parseInt(rating), review, treatment || '']);
  res.redirect('/admin');
});

app.post('/admin/testimonials/:id/delete', requireAdmin, (req, res) => {
  runQuery('DELETE FROM testimonials WHERE id = ?', [parseInt(req.params.id)]);
  res.redirect('/admin');
});

app.post('/admin/gallery', requireAdmin, upload.single('image'), (req, res) => {
  const { title, category, sort_order } = req.body;
  if (req.file) {
    runQuery('INSERT INTO gallery (title, image_url, category, sort_order) VALUES (?, ?, ?, ?)',
      [title || '', '/uploads/' + req.file.filename, category || 'clinic', sort_order || 0]);
  }
  res.redirect('/admin');
});

app.post('/admin/gallery/:id/delete', requireAdmin, (req, res) => {
  runQuery('DELETE FROM gallery WHERE id = ?', [parseInt(req.params.id)]);
  res.redirect('/admin');
});

app.post('/admin/appointments/:id/delete', requireAdmin, (req, res) => {
  runQuery('DELETE FROM appointments WHERE id = ?', [parseInt(req.params.id)]);
  res.redirect('/admin');
});

app.post('/admin/appointments/:id/confirm', requireAdmin, (req, res) => {
  runQuery('UPDATE appointments SET status = ? WHERE id = ?', ['confirmed', parseInt(req.params.id)]);
  res.redirect('/admin');
});

app.post('/admin/blogs', requireAdmin, upload.single('image'), (req, res) => {
  const { title, excerpt, content, category } = req.body;
  const slug = slugify(title, { lower: true, strict: true });
  let image = '';
  if (req.file) image = '/uploads/' + req.file.filename;
  runQuery('INSERT INTO blogs (title, slug, excerpt, content, image, category) VALUES (?, ?, ?, ?, ?, ?)',
    [title, slug, excerpt || '', content, image, category || 'Skin Care']);
  res.redirect('/admin');
});

app.post('/admin/blogs/:id/delete', requireAdmin, (req, res) => {
  runQuery('DELETE FROM blogs WHERE id = ?', [parseInt(req.params.id)]);
  res.redirect('/admin');
});

app.post('/admin/faqs', requireAdmin, (req, res) => {
  const { question, answer, category, sort_order } = req.body;
  runQuery('INSERT INTO faqs (question, answer, category, sort_order) VALUES (?, ?, ?, ?)',
    [question, answer, category || 'General', sort_order || 0]);
  res.redirect('/admin');
});

app.post('/admin/faqs/:id/delete', requireAdmin, (req, res) => {
  runQuery('DELETE FROM faqs WHERE id = ?', [parseInt(req.params.id)]);
  res.redirect('/admin');
});

app.post('/admin/before-after', requireAdmin, upload.fields([{ name: 'before_image', maxCount: 1 }, { name: 'after_image', maxCount: 1 }]), (req, res) => {
  const { title, treatment, description, sort_order } = req.body;
  const beforeImg = req.files['before_image'] ? '/uploads/' + req.files['before_image'][0].filename : null;
  const afterImg = req.files['after_image'] ? '/uploads/' + req.files['after_image'][0].filename : null;
  if (beforeImg && afterImg) {
    runQuery('INSERT INTO before_after (title, before_image, after_image, treatment, description, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      [title, beforeImg, afterImg, treatment || '', description || '', sort_order || 0]);
  }
  res.redirect('/admin');
});

app.post('/admin/before-after/:id/delete', requireAdmin, (req, res) => {
  runQuery('DELETE FROM before_after WHERE id = ?', [parseInt(req.params.id)]);
  res.redirect('/admin');
});

// ==================== OFFLINE CRM ====================
app.post('/admin/offline-patients', requireAdmin, (req, res) => {
  const { name, gender, phone, disease } = req.body;
  if (!name || !gender || !phone || !disease) {
    return res.status(400).send('All fields are required');
  }
  runQuery('INSERT INTO offline_patients (name, gender, phone, disease) VALUES (?, ?, ?, ?)',
    [name, gender, phone, disease]);
  const newPatient = getOne('SELECT id FROM offline_patients ORDER BY id DESC LIMIT 1');
  const redirectUrl = newPatient ? `/admin/offline-patients?id=${newPatient.id}` : '/admin/offline-patients';
  res.redirect(redirectUrl);
});

app.post('/admin/offline-patients/:id/delete', requireAdmin, (req, res) => {
  const patientId = parseInt(req.params.id);
  runQuery('DELETE FROM offline_patients WHERE id = ?', [patientId]);
  runQuery('DELETE FROM patient_visits WHERE patient_id = ?', [patientId]);
  res.redirect('/admin/offline-patients');
});

app.get('/admin/offline-patients', requireAdmin, (req, res) => {
  const doctor = getOne('SELECT * FROM doctor WHERE id = 1');
  const offlinePatients = getAll('SELECT * FROM offline_patients ORDER BY created_at DESC');
  
  const activeId = req.query.id ? parseInt(req.query.id) : null;
  let patient = null;
  let visits = [];
  let visits15Days = 0;
  let visits30Days = 0;
  let suggestedConsultationFee = 500;
  let daysSincePaidVisit = null;
  let lastPaidVisit = null;

  if (activeId) {
    patient = getOne('SELECT * FROM offline_patients WHERE id = ?', [activeId]);
    if (patient) {
      visits = getAll('SELECT * FROM patient_visits WHERE patient_id = ? ORDER BY visit_date DESC, id DESC', [activeId]);
      
      const now = new Date();
      const oneDayMs = 24 * 60 * 60 * 1000;
      
      visits.forEach(v => {
        const visitDate = new Date(v.visit_date);
        const diffTime = now - visitDate;
        const diffDays = diffTime / oneDayMs;
        if (diffDays >= 0 && diffDays <= 15) {
          visits15Days++;
        }
        if (diffDays >= 0 && diffDays <= 30) {
          visits30Days++;
        }
      });

      lastPaidVisit = getOne(
        'SELECT * FROM patient_visits WHERE patient_id = ? AND consultation_fee > 0 ORDER BY visit_date DESC, id DESC LIMIT 1',
        [activeId]
      );
      
      if (lastPaidVisit) {
        const lastPaidDate = new Date(lastPaidVisit.visit_date);
        const d1 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const d2 = new Date(lastPaidDate.getFullYear(), lastPaidDate.getMonth(), lastPaidDate.getDate());
        const diffDays = Math.floor(Math.abs(d1 - d2) / oneDayMs);
        daysSincePaidVisit = diffDays;
        
        if (diffDays <= 15) {
          suggestedConsultationFee = 0;
        }
      }
    }
  }

  res.render('admin/offline-crm', {
    doctor,
    offlinePatients,
    patient,
    visits,
    visits15Days,
    visits30Days,
    suggestedConsultationFee,
    daysSincePaidVisit,
    lastPaidVisit
  });
});

app.post('/admin/offline-patients/:id/visits', requireAdmin, (req, res) => {
  const patientId = parseInt(req.params.id);
  const { visit_date, consultation_fee, treatment_charges, notes } = req.body;
  if (!visit_date) return res.status(400).send('Visit date is required');
  
  const cFee = parseFloat(consultation_fee) || 0;
  const tCharges = parseFloat(treatment_charges) || 0;
  const totalCharged = cFee + tCharges;
  
  runQuery('INSERT INTO patient_visits (patient_id, visit_date, consultation_fee, treatment_charges, total_charged, notes) VALUES (?, ?, ?, ?, ?, ?)',
    [patientId, visit_date, cFee, tCharges, totalCharged, notes || '']);
  
  res.redirect(`/admin/offline-patients?id=${patientId}`);
});

app.get('/admin/visits/:id/receipt', requireAdmin, (req, res) => {
  const visitId = parseInt(req.params.id);
  const doctor = getOne('SELECT * FROM doctor WHERE id = 1');
  const visit = getOne(
    'SELECT v.*, p.name, p.phone, p.gender, p.disease FROM patient_visits v JOIN offline_patients p ON v.patient_id = p.id WHERE v.id = ?',
    [visitId]
  );
  if (!visit) return res.status(404).render('404', { doctor });
  
  res.render('admin/receipt', { doctor, visit });
});

// 404
app.use((req, res) => {
  const doctor = getOne('SELECT * FROM doctor WHERE id = 1');
  res.status(404).render('404', { doctor });
});

// Start server after DB init
async function start() {
  await initDB();
  // Auto-seed if doctor table is empty
  const doctor = getOne('SELECT id FROM doctor WHERE id = 1');
  if (!doctor) {
    console.log('Empty database detected, running seed...');
    require('./seed');
    // Wait for seed to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

start().catch(console.error);
