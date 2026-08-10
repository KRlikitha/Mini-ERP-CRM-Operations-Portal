import app from './app';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Mini ERP + CRM Server listening on port ${PORT}`);
  console.log(`📡 API Healthcheck: http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});
