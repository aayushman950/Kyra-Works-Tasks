require('dotenv').config();
const Fastify = require('fastify');
const fastify = Fastify({ logger: true });
const Redis = require('ioredis');
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

fastify.register(require('@fastify/jwt'), { secret: JWT_SECRET });

const redis = new Redis(REDIS_URL);

const SESSION_PREFIX = 'sess:';
const REFRESH_PREFIX = 'refr:';

fastify.decorate('authenticate', async (request, reply) => {
  try {
    const auth = request.headers['authorization'];
    if (!auth) return reply.code(401).send({ error: 'Missing Authorization header' });

    const token = auth.split(' ')[1];
    const decoded = fastify.jwt.verify(token);

    const sessionId = decoded.sid;
    if (!sessionId) return reply.code(401).send({ error: 'Invalid token payload' });

    const raw = await redis.get(SESSION_PREFIX + sessionId);
    if (!raw) {
      return reply.code(401).send({ error: 'Session not active' });
    }

    request.user = JSON.parse(raw);
    request.sessionId = sessionId;
  } catch (err) {
    request.log.info({ err }, 'auth failed');
    return reply.code(401).send({ error: 'Invalid or expired token' });
  }
});


fastify.post('/login', async (request, reply) => {
  const { username, password } = request.body || {};
  if (!username || !password) return reply.code(400).send({ error: 'username and password are required' });

  if (!(username === 'aayush' && password === 'aayush123')) {
    return reply.code(401).send({ error: 'Invalid username or password' });
  }

  const user = { id: `user:${username}`, username };

  const sessionId = uuidv4();
  const sessionKey = SESSION_PREFIX + sessionId;
  await redis.set(sessionKey, JSON.stringify(user), 'EX', 7 * 24 * 60 * 60); // 7 days

  const accessToken = fastify.jwt.sign({ uid: user.id, sid: sessionId }, { expiresIn: '15m' });

  const refreshToken = uuidv4();
  const refreshKey = REFRESH_PREFIX + refreshToken;
  await redis.set(refreshKey, sessionId, 'EX', 7 * 24 * 60 * 60);

  return reply.send({ accessToken, refreshToken });
});

fastify.post('/token/refresh', async (request, reply) => {
  const { refreshToken } = request.body || {};
  if (!refreshToken) return reply.code(400).send({ error: 'refreshToken required' });

  const sessionId = await redis.get(REFRESH_PREFIX + refreshToken);
  if (!sessionId) return reply.code(401).send({ error: 'Invalid refresh token' });

  const sessionRaw = await redis.get(SESSION_PREFIX + sessionId);
  if (!sessionRaw) {
    return reply.code(401).send({ error: 'Session expired' });
  }

  await redis.del(REFRESH_PREFIX + refreshToken);
  const newRefresh = uuidv4();
  await redis.set(REFRESH_PREFIX + newRefresh, sessionId, 'EX', 7 * 24 * 60 * 60);

  const user = JSON.parse(sessionRaw);
  const accessToken = fastify.jwt.sign({ uid: user.id, sid: sessionId }, { expiresIn: '15m' });

  return reply.send({ accessToken, refreshToken: newRefresh });
});

fastify.post('/logout', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const sessionKey = SESSION_PREFIX + request.sessionId;
  await redis.del(sessionKey);
  return reply.send({ ok: true });
});

fastify.get('/protected', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  return reply.send({ hello: `Hello ${request.user.username}!`, user: request.user });
});

const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    fastify.log.info(`listening on ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();