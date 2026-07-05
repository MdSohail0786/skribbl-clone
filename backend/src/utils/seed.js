/* eslint-disable no-console */
require('dotenv').config();
const mongoose = require('mongoose');
const env = require('../config/env');
const Word = require('../models/Word');
const wordBank = require('../constants/wordBank');

async function seed() {
  if (!env.MONGODB_URI) {
    console.error('MONGODB_URI is not set in .env — nothing to seed.');
    process.exit(1);
  }
  await mongoose.connect(env.MONGODB_URI);
  console.log('Connected. Seeding word bank...');

  const docs = Object.entries(wordBank).flatMap(([category, words]) =>
    words.map((word) => ({ word, category }))
  );

  let inserted = 0;
  for (const doc of docs) {
    // eslint-disable-next-line no-await-in-loop
    const res = await Word.updateOne(doc, { $set: doc }, { upsert: true });
    if (res.upsertedCount) inserted += 1;
  }

  console.log(`Done. ${inserted} new words inserted (${docs.length} total in bank).`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
