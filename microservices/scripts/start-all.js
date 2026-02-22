/**
 * Start All Microservices Script
 * Starts all services in the correct order
 */

const { spawn } = require('child_process');
const path = require('path');

const isDev = process.argv.includes('--dev');
const command = isDev ? 'dev' : 'start';

const services = [
  { name: 'Auth Service', dir: 'auth-service', port: 4001 },
  { name: 'Vehicle Service', dir: 'vehicle-service', port: 4002 },
  { name: 'Reservation Service', dir: 'reservation-service', port: 4003 },
  { name: 'Payment Service', dir: 'payment-service', port: 4004 },
  { name: 'Notification Service', dir: 'notification-service', port: 4005 },
  { name: 'API Gateway', dir: 'api-gateway', port: 4000 },
];

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const serviceColors = [
  colors.cyan,
  colors.magenta,
  colors.yellow,
  colors.green,
  colors.blue,
  colors.red,
];

console.log('\n🚀 Starting Lava Auto Microservices...\n');

const processes = [];

services.forEach((service, index) => {
  const color = serviceColors[index % serviceColors.length];
  const servicePath = path.join(__dirname, '..', service.dir);
  
  const proc = spawn('npm', ['run', command], {
    cwd: servicePath,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PORT: service.port }
  });

  proc.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      console.log(`${color}[${service.name}]${colors.reset} ${line}`);
    });
  });

  proc.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      console.log(`${color}[${service.name}]${colors.reset} ${colors.red}${line}${colors.reset}`);
    });
  });

  proc.on('close', (code) => {
    console.log(`${color}[${service.name}]${colors.reset} exited with code ${code}`);
  });

  processes.push(proc);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down all services...');
  processes.forEach(proc => {
    proc.kill('SIGTERM');
  });
  process.exit(0);
});

process.on('SIGTERM', () => {
  processes.forEach(proc => {
    proc.kill('SIGTERM');
  });
  process.exit(0);
});

console.log('\n📡 Services starting on:');
services.forEach(service => {
  console.log(`   - ${service.name}: http://localhost:${service.port}`);
});
console.log('\n');
