// Run manually via `npm run seed`. This is intentionally NOT invoked
// automatically on server start, so re-running the server never wipes
// existing problem data unexpectedly.

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Problem = require('../models/Problem');
const problems = require('./problems.data');

async function seed() {
  await connectDB();

  try {
    await Problem.deleteMany({});
    const inserted = await Problem.insertMany(problems);
    console.log(`Seeded ${inserted.length} problems.`);
  } catch (err) {
    console.error('Seeding failed:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

seed();