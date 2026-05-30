const dns = require('dns');
const mongoose = require('mongoose');

/**
 * Resolve mongodb+srv:// using a dedicated DNS resolver (process-wide DNS unchanged).
 * Opt-in via MONGODB_DNS_SERVERS (comma-separated, e.g. "8.8.8.8,1.1.1.1").
 */
function parseSrvUri(uri) {
  const withoutScheme = uri.replace(/^mongodb\+srv:\/\//, '');
  const atIndex = withoutScheme.lastIndexOf('@');
  if (atIndex === -1) {
    throw new Error('Invalid mongodb+srv URI.');
  }

  const credentials = withoutScheme.slice(0, atIndex + 1);
  const rest = withoutScheme.slice(atIndex + 1);
  const [hostAndPath, queryString] = rest.split('?');
  const slashIndex = hostAndPath.indexOf('/');
  const hostname = slashIndex === -1 ? hostAndPath : hostAndPath.slice(0, slashIndex);
  const dbPath = slashIndex === -1 ? '' : hostAndPath.slice(slashIndex);
  const query = queryString ? `?${queryString}` : '';

  return { credentials, hostname, dbPath, query };
}

async function resolveMongoUri(uri) {
  if (!uri?.startsWith('mongodb+srv://')) {
    return uri;
  }

  const dnsServers = process.env.MONGODB_DNS_SERVERS?.split(',')
    .map((server) => server.trim())
    .filter(Boolean);

  if (!dnsServers.length) {
    return uri;
  }

  const { credentials, hostname, dbPath, query } = parseSrvUri(uri);
  const resolver = new dns.promises.Resolver();
  resolver.setServers(dnsServers);

  const [srvRecords, txtRecords] = await Promise.all([
    resolver.resolveSrv(`_mongodb._tcp.${hostname}`),
    resolver.resolveTxt(hostname).catch(() => []),
  ]);

  const hosts = srvRecords.map((record) => `${record.name}:${record.port}`).join(',');
  const txtParams = txtRecords.flat().join('&');
  const extraQuery = query.replace(/^\?/, '');
  const mergedParams = [txtParams, 'ssl=true', extraQuery].filter(Boolean).join('&');

  return `mongodb://${credentials}${hosts}${dbPath}?${mergedParams}`;
}

const connectDB = async () => {
  try {
    const uri = await resolveMongoUri(process.env.MONGODB_URI);
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
