import jwt from 'jsonwebtoken';
import createError from 'http-errors';

export const socketAuthMiddleware = (socket, next) => {
  const token =
    socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

  if (!token) {
    return next(createError(401, 'Authentication error: Token required'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded; // { userId, tenantId, roles, ... }
    next();
  } catch (error) {
    next(createError(401, `Authentication error: ${error.message}`));
  }
};
