const os = require('os');

const networkInterfaces = os.networkInterfaces();
console.log('\x1b[35m%s\x1b[0m', '┌──────────────────────────────────────────────────────────┐');
console.log('\x1b[35m%s\x1b[0m', '│ 📱 MOBILE LINK (ON YOUR WI-FI NETWORK):             │');
console.log('\x1b[35m%s\x1b[0m', '├──────────────────────────────────────────────────────────┤');
console.log('\x1b[35m%s\x1b[0m', '│ Computer:                                               │');
console.log('│   🔗 \x1b[36mhttp://localhost:3000\x1b[0m                               │');
console.log('│   🔗 \x1b[36mhttp://127.0.0.1:3000\x1b[0m                               │');
console.log('\x1b[35m%s\x1b[0m', '│                                                          │');
console.log('\x1b[35m%s\x1b[0m', '│ Phone:                                                 │');

let count = 0;
Object.keys(networkInterfaces).forEach((interfaceName) => {
  const interfaces = networkInterfaces[interfaceName];
  interfaces.forEach((iface) => {
    if (iface.family === 'IPv4' && !iface.internal && iface.address.startsWith('192.168.')) {
      const link = `http://${iface.address}:3000`;
      const padding = ' '.repeat(51 - link.length);
      console.log(`│   🔗 \x1b[32m${link}\x1b[0m${padding}│`);
      count++;
    }
  });
});

if (count === 0) {
  console.log('\x1b[31m%s\x1b[0m', '│   ⚠️  Wi-Fi IP (192.168.x.x) not found!                  │');
}

console.log('\x1b[35m%s\x1b[0m', '└──────────────────────────────────────────────────────────┘\n');
