const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-before-deploying';
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());

// ---------- JSON file "database" helpers ----------
const readDb = () => {
  try {
    const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    return { users: db.users || [], expenses: db.expenses || [] };
  } catch {
    return { users: [], expenses: [] };
  }
};
const writeDb = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
const newId = () => Date.now() * 1000 + Math.floor(Math.random() * 1000);

// ---------- Auth ----------
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email });
const signToken = (u) => jwt.sign({ id: u.id }, JWT_SECRET, { expiresIn: '7d' });

app.post('/api/auth/register', async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!name) return res.status(400).json({ message: 'Name is required.' });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
  if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters.' });

  const db = readDb();
  if (db.users.some((u) => u.email === email)) {
    return res.status(409).json({ message: 'An account with this email already exists.' });
  }
  const user = { id: newId(), name, email, passwordHash: await bcrypt.hash(password, 10) };
  db.users.push(user);
  writeDb(db);
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

app.post('/api/auth/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const user = readDb().users.find((u) => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: 'Incorrect email or password.' });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

// Middleware: every route below needs a valid token
function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Please log in.' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (!readDb().users.some((u) => u.id === payload.id)) throw new Error('unknown user');
    req.userId = payload.id;
    next();
  } catch {
    res.status(401).json({ message: 'Your session has expired. Please log in again.' });
  }
}

// ---------- Expenses (each user only sees their own) ----------
function validate(body) {
  const title = String(body.title || '').trim();
  const amount = Number(body.amount);
  if (!title) return 'Title is required.';
  if (!Number.isFinite(amount) || amount <= 0) return 'Amount must be greater than 0.';
  if (!['expense', 'income'].includes(body.type)) return 'Type must be expense or income.';
  if (!body.category) return 'Category is required.';
  if (!body.date || Number.isNaN(Date.parse(body.date))) return 'A valid date is required.';
  return null;
}
const clean = (b) => ({
  title: String(b.title).trim(),
  amount: Number(b.amount),
  type: b.type,
  category: b.category,
  date: b.date,
});
const strip = ({ userId, ...rest }) => rest;

app.get('/api/expenses', auth, (req, res) => {
  res.json(readDb().expenses.filter((e) => e.userId === req.userId).map(strip));
});

app.post('/api/expenses', auth, (req, res) => {
  const error = validate(req.body);
  if (error) return res.status(400).json({ message: error });
  const db = readDb();
  const item = { id: newId(), userId: req.userId, ...clean(req.body) };
  db.expenses.push(item);
  writeDb(db);
  res.status(201).json(strip(item));
});

app.put('/api/expenses/:id', auth, (req, res) => {
  const error = validate(req.body);
  if (error) return res.status(400).json({ message: error });
  const db = readDb();
  const index = db.expenses.findIndex((e) => e.id === Number(req.params.id) && e.userId === req.userId);
  if (index === -1) return res.status(404).json({ message: 'Transaction not found.' });
  db.expenses[index] = { id: db.expenses[index].id, userId: req.userId, ...clean(req.body) };
  writeDb(db);
  res.json(strip(db.expenses[index]));
});

app.delete('/api/expenses/:id', auth, (req, res) => {
  const db = readDb();
  const before = db.expenses.length;
  db.expenses = db.expenses.filter((e) => !(e.id === Number(req.params.id) && e.userId === req.userId));
  if (db.expenses.length === before) return res.status(404).json({ message: 'Transaction not found.' });
  writeDb(db);
  res.status(204).end();
});

app.listen(PORT, () => console.log(`Expense Tracker API running at http://localhost:${PORT}`));
