import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Add a measurement from 7 days ago with slightly different values
const weekAgo = new Date();
weekAgo.setDate(weekAgo.getDate() - 7);
const dateStr = weekAgo.toLocaleDateString("en-US", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

// Get the user ID (should be 1 for the owner)
const [users] = await connection.execute('SELECT id FROM user LIMIT 1');
const userId = users[0]?.id || 1;

// Insert test measurement
await connection.execute(
  'INSERT INTO body_measurements (user_id, date, weight, chest, waist, arms, thighs, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
  [userId, dateStr, 205, 40, 34, 15.5, 23]
);

console.log('Test measurement added successfully!');
await connection.end();
