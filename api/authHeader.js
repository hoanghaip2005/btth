function tokenFromHeader(authorization) {
  if (!authorization) {
    return '';
  }

  if (authorization.startsWith('Bearer ')) {
    return authorization.slice('Bearer '.length).trim();
  }

  return authorization.trim();
}

module.exports = {
  tokenFromHeader
};
