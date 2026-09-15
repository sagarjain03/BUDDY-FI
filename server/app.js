require('dotenv').config();

const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const discoverRoutes = require('./routes/discoverRoutes');
const connectionRoutes = require('./routes/connectionRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const { attach: attachSockets } = require('./socket');
const { globalLimiter } = require('./middlewares/rateLimit');

const app = express();

// Only allow the front-end origins we know about.
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser clients (curl, Postman) that send no Origin header.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    const error = new Error(`Origin ${origin} is not allowed by CORS`);
    error.status = 403;
    return callback(error);
  },
  credentials: true,
};

// Behind a proxy (Render, Railway, nginx) every request otherwise looks like
// it came from the proxy, and one limiter would lock out every user at once.
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY));

app.use(cors(corsOptions));
app.use(express.json({ limit: '100kb' }));
app.use(globalLimiter);

// Locally stored avatars, used when no image host is configured.
app.use('/uploads', express.static(require('./utils/imageStore').LOCAL_DIR, { maxAge: '7d' }));

app.get('/health', (req, res) =>
  res.json({
    status: 'ok',
    // Named so the test runner can refuse to run against a real database.
    db: require('mongoose').connection.name || null,
  })
);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/discover', discoverRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/blocks', require('./routes/blockRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/questions', require('./routes/questionRoutes'));

// A local inbox for the verification and reset flows. Never in production.
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/dev', require('./routes/devRoutes'));
}

// Unknown route
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: `Cannot ${req.method} ${req.originalUrl}` });
});

// Central error handler so failures return JSON instead of an HTML stack trace.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    status: 'error',
    message: status === 500 ? 'Something went wrong. Please try again.' : err.message,
  });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true },
});

attachSockets(io);

const PORT = process.env.PORT || 5000;

// Only start listening once the database is actually reachable.
const start = async () => {
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not set. Copy .env.example to .env and fill it in.');
    process.exit(1);
  }

  await connectDB();

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

start();
