function errorHandler(err, req, res, next) {
  console.error('[Error]', err.message || err);

  if (err.type === 'validation') {
    return res.status(400).json({ error: err.message, details: err.details });
  }

  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }

  return res.status(500).json({ error: 'Internal server error. Please try again later.' });
}

module.exports = { errorHandler };
