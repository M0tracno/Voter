const http = require('http');

async function testSetup() {
  try {
    console.log('Testing setup endpoint...');
    
    const data = JSON.stringify({
      booth_id: 'TEST001',
      operator_name: 'Test User',
      operator_id: 'OP001',
      username: 'testuser001',
      email: 'test001@example.com',
      password: 'password123',
      location: 'Test Location'
    });
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/setup',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    
    const req = http.request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        console.log('Response:', body);
      });
    });
    
    req.on('error', (e) => {
      console.error(`Problem with request: ${e.message}`);
    });
    
    req.write(data);
    req.end();
    
  } catch (error) {
    console.log('Error:', error.message);
  }
}

testSetup();
