const fs = require('fs');
const path = '/Users/miguelmendosa/Documents/GitHub/lava-auto/src/lib/api-client.ts';
let content = fs.readFileSync(path, 'utf8');

const regex = /(export const adminApi = \{[^]*?)(getUsers:)/;
const replacement = `$1createAdmin: (data: { name: string; email: string; password: string; phone?: string }, token: string) =>
    apiRequest<{ message: string; admin: { id: string; name: string; email: string; role: string } }>('/api/users/admin', {
      method: 'POST',
      body: data,
      token,
    }),
  $2`;

if (!content.includes('createAdmin:')) {
  if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(path, content);
    console.log('Client updated successfully.');
  } else {
    console.log('Could not find regex match for adminApi.getUsers.');
  }
} else {
  console.log('createAdmin already exists.');
}
