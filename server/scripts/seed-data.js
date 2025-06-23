const { initializeDatabase, getDatabase, closeDatabase } = require('../database/init');
const crypto = require('crypto');

// Sample voter data generator
function generateSampleVoters(count = 1000) {
  const voters = [];
  const districts = ['North District', 'South District', 'East District', 'West District', 'Central District'];
  const firstNames = [
    'Aarav', 'Ananya', 'Arjun', 'Diya', 'Ishaan', 'Kavya', 'Rohan', 'Saanvi', 'Vivaan', 'Aadhya',
    'Advik', 'Anika', 'Ayaan', 'Dhanvi', 'Kiaan', 'Myra', 'Reyansh', 'Sara', 'Vihaan', 'Zara',
    'Amit', 'Priya', 'Rajesh', 'Sunita', 'Vikram', 'Neha', 'Suresh', 'Pooja', 'Manish', 'Deepika'
  ];
  const lastNames = [
    'Sharma', 'Verma', 'Singh', 'Kumar', 'Gupta', 'Agarwal', 'Jain', 'Patel', 'Shah', 'Mehta',
    'Reddy', 'Nair', 'Iyer', 'Rao', 'Pillai', 'Menon', 'Bhat', 'Joshi', 'Desai', 'Trivedi'
  ];

  for (let i = 1; i <= count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const district = districts[Math.floor(Math.random() * districts.length)];
    
    // Generate realistic voter ID (state code + district + sequential)
    const voterId = `WB${district.charAt(0)}${String(i).padStart(6, '0')}`;
    
    // Generate random DOB (18-80 years old)
    const minAge = 18;
    const maxAge = 80;
    const today = new Date();
    const birthYear = today.getFullYear() - (minAge + Math.floor(Math.random() * (maxAge - minAge)));
    const birthMonth = Math.floor(Math.random() * 12) + 1;
    const birthDay = Math.floor(Math.random() * 28) + 1;
    const dateOfBirth = `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`;
    
    // Generate mobile number (Indian format)
    const mobilePrefix = ['9', '8', '7', '6'][Math.floor(Math.random() * 4)];
    const mobileNumber = `+91${mobilePrefix}${Math.floor(Math.random() * 900000000 + 100000000)}`;
    
    // Assign to specific polling booth based on district
    const boothNumber = Math.floor(Math.random() * 10) + 1;
    const pollingBooth = `${district.replace(' District', '')}-Booth-${boothNumber}`;

    voters.push({
      voter_id: voterId,
      full_name: `${firstName} ${lastName}`,
      date_of_birth: dateOfBirth,
      registered_mobile: mobileNumber,
      district: district,
      polling_booth: pollingBooth,
      photo_hash: crypto.createHash('md5').update(`${voterId}-photo`).digest('hex'),
      is_active: Math.random() > 0.02 // 98% active, 2% inactive
    });
  }

  return voters;
}

// Sample booth data
function generateSampleBooths() {
  const districts = ['North District', 'South District', 'East District', 'West District', 'Central District'];
  const booths = [];

  districts.forEach(district => {
    for (let i = 1; i <= 10; i++) {
      const boothId = `${district.replace(' District', '')}-Booth-${i}`;
      booths.push({
        booth_id: boothId,
        booth_name: `Polling Booth ${i}`,
        location: `${district} - Sector ${i}`,
        district: district,
        api_token: crypto.randomBytes(32).toString('hex'),
        is_active: true
      });
    }
  });

  return booths;
}

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Initialize database
    await initializeDatabase();
    const db = getDatabase();

    // Check if data already exists
    const existingVoters = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM voters', (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });

    if (existingVoters > 0) {
      console.log(`📊 Database already contains ${existingVoters} voters. Skipping seed.`);
      console.log('💡 To re-seed, delete the fastverify.db file and run this script again.');
      return;
    }

    // Generate sample data
    console.log('📝 Generating sample voter data...');
    const voters = generateSampleVoters(1000);
    
    console.log('🏢 Generating sample booth data...');
    const booths = generateSampleBooths();

    // Insert voters
    console.log('👥 Inserting voters...');
    const voterStmt = db.prepare(`
      INSERT INTO voters (voter_id, full_name, date_of_birth, registered_mobile, district, polling_booth, photo_hash, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let voterCount = 0;
    for (const voter of voters) {
      await new Promise((resolve, reject) => {
        voterStmt.run(
          voter.voter_id,
          voter.full_name,
          voter.date_of_birth,
          voter.registered_mobile,
          voter.district,
          voter.polling_booth,
          voter.photo_hash,
          voter.is_active ? 1 : 0,
          (err) => {
            if (err) reject(err);
            else {
              voterCount++;
              if (voterCount % 100 === 0) {
                console.log(`  ✅ Inserted ${voterCount} voters...`);
              }
              resolve();
            }
          }
        );
      });
    }
    voterStmt.finalize();

    // Insert booths
    console.log('🏢 Inserting booths...');
    const boothStmt = db.prepare(`
      INSERT INTO booths (booth_id, booth_name, location, district, api_token, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    let boothCount = 0;
    for (const booth of booths) {
      await new Promise((resolve, reject) => {
        boothStmt.run(
          booth.booth_id,
          booth.booth_name,
          booth.location,
          booth.district,
          booth.api_token,
          booth.is_active ? 1 : 0,
          (err) => {
            if (err) reject(err);
            else {
              boothCount++;
              resolve();
            }
          }
        );
      });
    }
    boothStmt.finalize();

    // Insert some sample audit logs
    console.log('📋 Creating sample audit logs...');
    const auditStmt = db.prepare(`
      INSERT INTO audit_logs (voter_id, booth_id, verification_method, verification_result, timestamp, hmac_signature, is_synced)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    // Create some historical verification data
    for (let i = 0; i < 200; i++) {
      const randomVoter = voters[Math.floor(Math.random() * voters.length)];
      const randomBooth = booths[Math.floor(Math.random() * booths.length)];
      const method = ['OTP', 'FACE', 'MANUAL'][Math.floor(Math.random() * 3)];
      const result = Math.random() > 0.1 ? 'SUCCESS' : 'FAILED'; // 90% success rate
      
      // Random timestamp within last 30 days
      const daysAgo = Math.floor(Math.random() * 30);
      const hoursAgo = Math.floor(Math.random() * 24);
      const minutesAgo = Math.floor(Math.random() * 60);
      const timestamp = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000) - (hoursAgo * 60 * 60 * 1000) - (minutesAgo * 60 * 1000));
      
      const hmac = crypto.createHmac('sha256', 'test-secret')
        .update(`${randomVoter.voter_id}|${timestamp.toISOString()}|${method}|${result}|${randomBooth.booth_id}`)
        .digest('hex');

      await new Promise((resolve, reject) => {
        auditStmt.run(
          randomVoter.voter_id,
          randomBooth.booth_id,
          method,
          result,
          timestamp.toISOString(),
          hmac,
          Math.random() > 0.2 ? 1 : 0, // 80% synced
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }
    auditStmt.finalize();

    console.log('✅ Database seeding completed successfully!');
    console.log(`📊 Created ${voterCount} voters`);
    console.log(`🏢 Created ${boothCount} booths`);
    console.log('📋 Created 200 sample audit logs');
    
    console.log('\n🔧 Sample booth credentials:');
    console.log('Booth ID: North-Booth-1');
    console.log(`API Token: ${booths[0].api_token}`);
    
    console.log('\n👤 Sample voter IDs for testing:');
    for (let i = 0; i < 5; i++) {
      const voter = voters[i];
      console.log(`${voter.voter_id} - ${voter.full_name} (${voter.registered_mobile})`);
    }

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase().then(() => {
    console.log('\n🎉 Seeding complete! You can now start the server.');
    process.exit(0);
  });
}

module.exports = { seedDatabase, generateSampleVoters, generateSampleBooths };
