// testing verify email
import transporter from '../utils/mailer.util';

async function testConnection() {
  try {
    await transporter.verify();
    console.log('Server is ready to take our messages');
  } catch (err) {
    console.error('Verification failed:', err);
  }
}

testConnection();
