const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Standardized proto path resolution for Node.js scripts
function resolveProtoPath(protoFileName) {
	return path.join(__dirname, 'libs/proto/src/definitions', protoFileName);
}

// Load the proto file using standardized path resolution
const PROTO_PATH = resolveProtoPath('vendor.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const vendorProto = grpc.loadPackageDefinition(packageDefinition).vendor;

// Create a client
const client = new vendorProto.VendorService(
  'localhost:5004',
  grpc.credentials.createInsecure()
);

console.log('Testing gRPC connection to vendor service...');

// Test the getVendorById method
client.getVendorById({ id: 'test-id' }, (error, response) => {
  if (error) {
    console.error('gRPC Error:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      details: error.details
    });
  } else {
    console.log('gRPC Response:', response);
  }
  
  // Close the client
  client.close();
}); 