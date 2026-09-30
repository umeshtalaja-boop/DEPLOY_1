const express = require('express');
const cors = require('cors');
const os = require('os');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Enable CORS and JSON body parsing
app.use(cors());
app.use(express.json());

// Pretty-print JSON responses with 2-space indentation
app.set('json spaces', 2);

// Enable 'trust proxy' so Express accurately reads client IPs behind reverse proxies, Nginx, or AWS ALBs
app.set('trust proxy', true);

// Helper function: Parse User Agent to extract browser and device OS
function parseUserAgent(uaString = '') {
  let browser = 'Other / API Client';
  if (uaString.includes('Edg/')) browser = 'Microsoft Edge';
  else if (uaString.includes('Chrome/')) browser = 'Google Chrome';
  else if (uaString.includes('Firefox/')) browser = 'Mozilla Firefox';
  else if (uaString.includes('Safari/') && !uaString.includes('Chrome')) browser = 'Apple Safari';
  else if (uaString.includes('curl/')) browser = 'cURL';
  else if (uaString.includes('PostmanRuntime/')) browser = 'Postman';

  let osName = 'Unknown OS';
  if (uaString.includes('Windows NT 10.0')) osName = 'Windows 10 / 11';
  else if (uaString.includes('Macintosh')) osName = 'macOS';
  else if (uaString.includes('iPhone')) osName = 'iOS (iPhone)';
  else if (uaString.includes('iPad')) osName = 'iOS (iPad)';
  else if (uaString.includes('Android')) osName = 'Android';
  else if (uaString.includes('Linux')) osName = 'Linux';

  return {
    browser,
    operatingSystem: osName,
    rawUserAgent: uaString || 'Not Provided'
  };
}

// Helper function: Fetch real Public IP & real Geolocation (even when running locally on localhost)
async function fetchRealIpAndLocation(req) {
  const forwarded = req.headers['x-forwarded-for'];
  let socketIp = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress || req.ip;

  // Clean IPv4-mapped IPv6 address (::ffff:192.168.1.1 -> 192.168.1.1)
  if (socketIp && socketIp.startsWith('::ffff:')) {
    socketIp = socketIp.replace('::ffff:', '');
  }

  const isLocalRequest = !socketIp || socketIp === '127.0.0.1' || socketIp === '::1' || socketIp === 'localhost';

  let publicIp = socketIp;
  let geoInfo = null;

  try {
    // If request is from localhost, query the public WAN IP of the network.
    // If deployed on EC2 and requested from remote client, query client's IP.
    const queryUrl = isLocalRequest
      ? 'http://ip-api.com/json/'
      : `http://ip-api.com/json/${encodeURIComponent(socketIp)}`;

    const response = await fetch(queryUrl, { signal: AbortSignal.timeout(3500) });
    if (response.ok) {
      const data = await response.json();
      if (data && data.status === 'success') {
        publicIp = data.query;
        geoInfo = {
          city: data.city,
          region: data.regionName,
          country: data.country,
          countryCode: data.countryCode,
          zipCode: data.zip,
          timezone: data.timezone,
          isp: data.isp,
          organization: data.org,
          latitude: data.lat,
          longitude: data.lon
        };
      }
    }
  } catch (err) {
    // Network lookup fallback
  }

  return {
    publicIp: publicIp || (isLocalRequest ? '127.0.0.1 (Local Network)' : socketIp),
    connectionType: isLocalRequest ? 'Localhost (Fetched WAN Public IP)' : 'Remote Client Public IP',
    networkLocation: geoInfo || {
      note: 'Geolocation data not reachable at the moment',
      fallbackIp: socketIp
    }
  };
}

// Helper function: Retrieve real system user details from the operating system
function getRealSystemUserDetails() {
  let userInfo = {};
  try {
    userInfo = os.userInfo();
  } catch (e) {
    userInfo = { username: process.env.USERNAME || process.env.USER || 'User' };
  }

  return {
    systemUsername: userInfo.username || 'System User',
    homeDirectory: userInfo.homedir || 'N/A',
    machineHostname: os.hostname(),
    platform: `${os.type()} ${os.release()} (${os.arch()})`,
    cpuCores: os.cpus().length,
    freeMemoryMB: Math.round(os.freemem() / (1024 * 1024)),
    totalMemoryMB: Math.round(os.totalmem() / (1024 * 1024))
  };
}

// 1. Root Route: Complete Real User Details + Real Public IP + Geolocation
app.get('/', async (req, res) => {
  const ipData = await fetchRealIpAndLocation(req);
  const sysUser = getRealSystemUserDetails();
  const clientDevice = parseUserAgent(req.headers['user-agent']);

  res.json({
    status: 'success',
    timestamp: new Date().toISOString(),
    realPublicIp: ipData.publicIp,
    connectionType: ipData.connectionType,
    realUserDetails: {
      username: sysUser.systemUsername,
      homeDirectory: sysUser.homeDirectory,
      machineHostname: sysUser.machineHostname,
      operatingSystem: sysUser.platform,
      totalMemory: `${sysUser.totalMemoryMB} MB`
    },
    ipGeolocation: ipData.networkLocation,
    clientDevice: {
      detectedBrowser: clientDevice.browser,
      detectedOS: clientDevice.operatingSystem,
      language: req.headers['accept-language'] || 'Unknown',
      rawUserAgent: clientDevice.rawUserAgent
    }
  });
});

// 2. /api/user-info: Returns real user details and IP
app.get('/api/user-info', async (req, res) => {
  const ipData = await fetchRealIpAndLocation(req);
  const sysUser = getRealSystemUserDetails();
  const clientDevice = parseUserAgent(req.headers['user-agent']);

  res.json({
    status: 'success',
    realPublicIp: ipData.publicIp,
    user: sysUser,
    location: ipData.networkLocation,
    device: clientDevice
  });
});

// 3. /api/ip: Quick endpoint returning solely the real public IP address and ISP/Location
app.get('/api/ip', async (req, res) => {
  const ipData = await fetchRealIpAndLocation(req);
  res.json({
    status: 'success',
    realPublicIp: ipData.publicIp,
    connectionType: ipData.connectionType,
    location: ipData.networkLocation
  });
});

// 4. Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    serverHost: os.hostname(),
    platform: `${os.type()} ${os.arch()}`
  });
});

// 5. 404 Handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found',
    requestedPath: req.path,
    validEndpoints: ['GET /', 'GET /api/user-info', 'GET /api/ip', 'GET /health']
  });
});

// Start listening
app.listen(PORT, HOST, () => {
  console.log(`======================================================`);
  console.log(`🚀 Real User & IP Service running on http://${HOST}:${PORT}`);
  console.log(`📡 Endpoints:`);
  console.log(`   - GET /              (Real Public IP + Real User Details + Location)`);
  console.log(`   - GET /api/user-info (Full details JSON)`);
  console.log(`   - GET /api/ip        (Real Public IP & ISP JSON)`);
  console.log(`   - GET /health        (Health check)`);
  console.log(`======================================================`);
});
