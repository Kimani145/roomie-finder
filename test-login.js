const http = require('http');

http.get('http://localhost:5173/login', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("RESPONSE HTTP CODE:", res.statusCode);
    if (!data.includes('src/main.tsx')) {
      console.log("Looks like it's NOT the vite server... maybe it's stalled.");
    } else {
      console.log("Vite server seems to be working.");
    }
  });
}).on('error', err => console.log('Error:', err.message));
