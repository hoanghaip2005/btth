const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const protoRoot = path.join(__dirname, '..', 'protos');

function loadPackage(protoFile, packageName) {
  const definition = protoLoader.loadSync(path.join(protoRoot, protoFile), {
    keepCase: false,
    longs: String,
    enums: String,
    defaults: false,
    oneofs: true,
    includeDirs: [protoRoot]
  });

  return grpc.loadPackageDefinition(definition)[packageName];
}

function startGrpcServer({ url, service, handlers, name }) {
  const server = new grpc.Server();
  server.addService(service, handlers);
  server.bindAsync(url, grpc.ServerCredentials.createInsecure(), (error, port) => {
    if (error) {
      console.error(`${name} gRPC server failed:`, error);
      process.exit(1);
    }

    console.log(`${name} gRPC server listening on ${url} (bound port ${port})`);
  });
}

module.exports = {
  grpc,
  loadPackage,
  startGrpcServer
};
