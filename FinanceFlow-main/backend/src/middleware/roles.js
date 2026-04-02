const ROLE_HIERARCHY = { viewer: 1, analyst: 2, admin: 3 };

/**
 * requireRole('admin') — must be exactly admin
 * requireMinRole('analyst') — analyst or higher
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}.`
      });
    }
    next();
  };
}

function requireMinRole(minRole) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const minLevel = ROLE_HIERARCHY[minRole] || 999;
    if (userLevel < minLevel) {
      return res.status(403).json({
        error: `Access denied. Minimum required role: ${minRole}. Your role: ${req.user.role}.`
      });
    }
    next();
  };
}

module.exports = { requireRole, requireMinRole };
