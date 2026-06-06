const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const db = require('../../db/connection');
const config = require('../../lib/config');
const { loadPackage, startGrpcServer } = require('../../lib/grpcLoader');
const {
  alreadyExists,
  invalidArgument,
  notFound,
  unauthenticated,
  wrapUnary
} = require('../../lib/grpcErrors');

const authPackage = loadPackage('auth.proto', 'auth');
const revokedTokens = new Set();

function toIsoString(value) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapUser(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    createdAt: toIsoString(row.created_at)
  };
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function createToken(userId) {
  return jwt.sign({ sub: userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  });
}

async function userFromToken(token) {
  if (!token) {
    throw unauthenticated();
  }

  if (revokedTokens.has(token)) {
    throw unauthenticated('Token has been logged out');
  }

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch (error) {
    throw unauthenticated('Invalid or expired token');
  }

  const user = await db('users').where({ id: payload.sub }).first();
  if (!user) {
    throw unauthenticated('Token user does not exist');
  }

  return user;
}

async function register(request) {
  const fullName = String(request.fullName || '').trim();
  const email = normalizeEmail(request.email);
  const password = String(request.password || '');

  if (!fullName || !email || password.length < 6) {
    throw invalidArgument('fullName, email and password with at least 6 characters are required');
  }

  const existing = await db('users').where({ email }).first();
  if (existing) {
    throw alreadyExists('Email is already registered');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db('users')
    .insert({
      full_name: fullName,
      email,
      password_hash: passwordHash
    })
    .returning('*');

  return {
    user: mapUser(user),
    token: createToken(user.id)
  };
}

async function login(request) {
  const email = normalizeEmail(request.email);
  const password = String(request.password || '');

  if (!email || !password) {
    throw invalidArgument('email and password are required');
  }

  const user = await db('users').where({ email }).first();
  if (!user) {
    throw notFound('User was not found');
  }

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    throw unauthenticated('Invalid email or password');
  }

  return {
    user: mapUser(user),
    token: createToken(user.id)
  };
}

async function me(request) {
  const user = await userFromToken(request.token);
  return mapUser(user);
}

async function logout(request) {
  await userFromToken(request.token);
  revokedTokens.add(request.token);
  return { value: true };
}

startGrpcServer({
  url: config.grpc.authUrl,
  service: authPackage.AuthService.service,
  handlers: {
    register: wrapUnary(register),
    login: wrapUnary(login),
    me: wrapUnary(me),
    logout: wrapUnary(logout)
  },
  name: 'AuthService'
});
