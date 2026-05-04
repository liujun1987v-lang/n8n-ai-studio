import app from '../server/_core/index.ts';
import path from 'path';
import express from 'express';

const distPath = path.join(process.cwd(), 'dist', 'public');
app.use(express.static(distPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      next();
    }
  });
});

export default app;
