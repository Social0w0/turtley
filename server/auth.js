const crypto = require('crypto');

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, hash) {
  const test = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(test, Buffer.from(hash, 'hex'));
}

function publicUser(u) {
  if (!u) return null;
  const { passwordHash, salt, ...rest } = u;
  return rest;
}

// Authorization: Bearer <token> 를 읽어 req.user 를 채웁니다.
function attachUser(db) {
  return (req, _res, next) => {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : null;
    if (token) {
      const s = db.find('sessions', x => x.token === token);
      if (s) req.user = db.find('users', u => u.id === s.userId) || null;
    }
    next();
  };
}

function requireAuth(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: '로그인이 필요해요.' });
    if (role && req.user.role !== role) return res.status(403).json({ error: '권한이 없어요.' });
    next();
  };
}

module.exports = { hashPassword, verifyPassword, publicUser, attachUser, requireAuth };
