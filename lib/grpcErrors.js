const { grpc } = require('./grpcLoader');

function grpcError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function invalidArgument(message) {
  return grpcError(grpc.status.INVALID_ARGUMENT, message);
}

function unauthenticated(message = 'Authentication is required') {
  return grpcError(grpc.status.UNAUTHENTICATED, message);
}

function permissionDenied(message = 'Permission denied') {
  return grpcError(grpc.status.PERMISSION_DENIED, message);
}

function notFound(message) {
  return grpcError(grpc.status.NOT_FOUND, message);
}

function alreadyExists(message) {
  return grpcError(grpc.status.ALREADY_EXISTS, message);
}

function wrapUnary(handler) {
  return async (call, callback) => {
    try {
      const result = await handler(call.request || {});
      callback(null, result || {});
    } catch (error) {
      callback({
        code: error.code || grpc.status.INTERNAL,
        message: error.message || 'Internal service error'
      });
    }
  };
}

module.exports = {
  invalidArgument,
  unauthenticated,
  permissionDenied,
  notFound,
  alreadyExists,
  wrapUnary
};
