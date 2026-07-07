require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// Auth middleware
const requireAuth = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect('/login');
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.clearCookie('token');
    res.redirect('/login');
  }
};

// Routes

// Home - redirect to dashboard or login
app.get('/', (req, res) => {
  const token = req.cookies.token;
  if (token) {
    try {
      jwt.verify(token, JWT_SECRET);
      return res.redirect('/dashboard');
    } catch (err) {
      res.clearCookie('token');
    }
  }
  res.redirect('/login');
});

// Signup page
app.get('/signup', (req, res) => {
  const token = req.cookies.token;
  if (token) {
    try {
      jwt.verify(token, JWT_SECRET);
      return res.redirect('/dashboard');
    } catch (err) {
      res.clearCookie('token');
    }
  }
  res.render('signup', { error: null, success: null });
});

// Signup handler
app.post('/signup', async (req, res) => {
  const { email, password, confirmPassword } = req.body;

  if (!email || !password) {
    return res.render('signup', { error: 'Email and password are required', success: null });
  }

  if (password !== confirmPassword) {
    return res.render('signup', { error: 'Passwords do not match', success: null });
  }

  if (password.length < 6) {
    return res.render('signup', { error: 'Password must be at least 6 characters', success: null });
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: null
      }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        return res.render('signup', { error: 'An account with this email already exists', success: null });
      }
      return res.render('signup', { error: error.message, success: null });
    }

    if (data.user) {
      const token = jwt.sign({ userId: data.user.id, email: data.user.email }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
      return res.redirect('/dashboard');
    }

    res.render('signup', { success: 'Account created! Please sign in.', error: null });
  } catch (err) {
    res.render('signup', { error: 'An error occurred. Please try again.', success: null });
  }
});

// Login page
app.get('/login', (req, res) => {
  const token = req.cookies.token;
  if (token) {
    try {
      jwt.verify(token, JWT_SECRET);
      return res.redirect('/dashboard');
    } catch (err) {
      res.clearCookie('token');
    }
  }
  res.render('login', { error: null });
});

// Login handler
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render('login', { error: 'Email and password are required' });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return res.render('login', { error: 'Invalid email or password' });
      }
      return res.render('login', { error: error.message });
    }

    if (data.user) {
      const token = jwt.sign({ userId: data.user.id, email: data.user.email }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
      return res.redirect('/dashboard');
    }

    res.render('login', { error: 'Login failed. Please try again.' });
  } catch (err) {
    res.render('login', { error: 'An error occurred. Please try again.' });
  }
});

// Logout
app.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

// Dashboard
app.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const { data: applications, error } = await supabase
      .from('job_applications')
      .select('*')
      .eq('user_id', req.user.userId)
      .order('date_applied', { ascending: false });

    if (error) throw error;

    const stats = {
      total: applications?.length || 0,
      applied: applications?.filter(a => a.status === 'Applied').length || 0,
      interview: applications?.filter(a => a.status === 'Interview Scheduled').length || 0,
      offer: applications?.filter(a => a.status === 'Offer Received').length || 0,
      rejected: applications?.filter(a => a.status === 'Rejected').length || 0
    };

    res.render('dashboard', { user: req.user, applications: applications || [], stats });
  } catch (err) {
    res.render('dashboard', { user: req.user, applications: [], stats: { total: 0, applied: 0, interview: 0, offer: 0, rejected: 0 } });
  }
});

// Add application page
app.get('/add', requireAuth, (req, res) => {
  res.render('add', { user: req.user, error: null });
});

// Add application handler
app.post('/add', requireAuth, async (req, res) => {
  const { company_name, job_role, date_applied, status, job_url, notes } = req.body;

  if (!company_name || !job_role || !date_applied) {
    return res.render('add', { user: req.user, error: 'Company name, job role, and date are required' });
  }

  try {
    const { error } = await supabase
      .from('job_applications')
      .insert({
        user_id: req.user.userId,
        company_name,
        job_role,
        date_applied,
        status: status || 'Applied',
        job_url: job_url || null,
        notes: notes || null
      });

    if (error) throw error;
    res.redirect('/dashboard');
  } catch (err) {
    res.render('add', { user: req.user, error: 'Failed to add application. Please try again.' });
  }
});

// Edit application page
app.get('/edit/:id', requireAuth, async (req, res) => {
  try {
    const { data: application, error } = await supabase
      .from('job_applications')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId)
      .maybeSingle();

    if (error || !application) {
      return res.redirect('/dashboard');
    }

    res.render('edit', { user: req.user, application, error: null });
  } catch (err) {
    res.redirect('/dashboard');
  }
});

// Edit application handler
app.post('/edit/:id', requireAuth, async (req, res) => {
  const { company_name, job_role, date_applied, status, job_url, notes } = req.body;

  if (!company_name || !job_role || !date_applied) {
    try {
      const { data: application } = await supabase
        .from('job_applications')
        .select('*')
        .eq('id', req.params.id)
        .eq('user_id', req.user.userId)
        .maybeSingle();
      return res.render('edit', { user: req.user, application, error: 'Company name, job role, and date are required' });
    } catch (err) {
      return res.redirect('/dashboard');
    }
  }

  try {
    const { error } = await supabase
      .from('job_applications')
      .update({
        company_name,
        job_role,
        date_applied,
        status,
        job_url: job_url || null,
        notes: notes || null
      })
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId);

    if (error) throw error;
    res.redirect('/dashboard');
  } catch (err) {
    try {
      const { data: application } = await supabase
        .from('job_applications')
        .select('*')
        .eq('id', req.params.id)
        .eq('user_id', req.user.userId)
        .maybeSingle();
      res.render('edit', { user: req.user, application, error: 'Failed to update application. Please try again.' });
    } catch (err) {
      res.redirect('/dashboard');
    }
  }
});

// Delete application
app.post('/delete/:id', requireAuth, async (req, res) => {
  try {
    await supabase
      .from('job_applications')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId);

    res.redirect('/dashboard');
  } catch (err) {
    res.redirect('/dashboard');
  }
});

// API endpoint for live search/filter
app.get('/api/applications', requireAuth, async (req, res) => {
  const { status, search } = req.query;

  try {
    let query = supabase
      .from('job_applications')
      .select('*')
      .eq('user_id', req.user.userId);

    if (status && status !== 'All') {
      query = query.eq('status', status);
    }

    const { data: applications, error } = await query.order('date_applied', { ascending: false });

    if (error) throw error;

    let filtered = applications || [];
    if (search && search.trim()) {
      const searchLower = search.toLowerCase().trim();
      filtered = filtered.filter(app =>
        app.company_name.toLowerCase().includes(searchLower)
      );
    }

    res.json({ success: true, applications: filtered });
  } catch (err) {
    res.json({ success: false, applications: [] });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { user: req.user || null });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('500', { user: req.user || null });
});

// Start server
app.listen(PORT, () => {
  console.log(`Job Tracker running on port ${PORT}`);
});

module.exports = app;
