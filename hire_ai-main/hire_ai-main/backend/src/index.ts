import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config, validateConfig } from './config.js';
import { initializeDatabase } from './db/database.js';

// Import routes
import companiesRouter from './routes/companies.js';
import peopleRouter from './routes/people.js';
import templatesRouter from './routes/templates.js';
import outreachRouter from './routes/outreach.js';
import discoveryRouter from './routes/discovery.js';
import systemRouter from './routes/system.js';

// Initialize
validateConfig();
initializeDatabase();

const app = express();

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS - allow frontend
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per window
    message: { success: false, error: 'Too many requests, please try again later' },
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (config.nodeEnv === 'development') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
        next();
    });
}

// API Routes
app.use('/api/companies', companiesRouter);
app.use('/api/people', peopleRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/outreach', outreachRouter);
app.use('/api/discovery', discoveryRouter);
app.use('/api', systemRouter);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'Lead Finder API',
        version: '1.0.0',
        status: 'running',
        docs: '/api/health',
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: config.nodeEnv === 'development' ? err.message : 'Internal server error',
    });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
    console.log(`
🚀 Lead Finder API Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Port:        ${PORT}
   Environment: ${config.nodeEnv}
   Database:    ${config.databasePath}
   SMTP:        ${config.smtp.host}:${config.smtp.port}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   API Docs:    http://localhost:${PORT}/api/health
   Frontend:    http://localhost:3000
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

export default app;
