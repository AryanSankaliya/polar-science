const { connectToDatabase, closeDatabase, getDb } = require('./Configuration/database');
const authService = require('./Services/AuthService');
const { hashPassword } = require('./Utilities/passwordUtils');

async function seed() {
  await connectToDatabase();
  const db = getDb();

  console.log('Seeding Demo RBAC Users & Submissions...');

  const passwordHash = await hashPassword('Password@123');

  // 1. Student Demo User
  await db.collection('users').updateOne(
    { email: 'student_demo@polar.test' },
    {
      $set: {
        email: 'student_demo@polar.test',
        username: 'student_demo',
        password_hash: passwordHash,
        name: 'Aryan Student (Demo)',
        role: 'student',
        institution: 'Indian Institute of Technology (IIT)',
        designation: 'Polar Science Fellow',
        updated_at: new Date().toISOString()
      },
      $setOnInsert: { created_at: new Date().toISOString() }
    },
    { upsert: true }
  );

  // 2. Researcher Demo User
  await db.collection('users').updateOne(
    { email: 'researcher_demo@polar.test' },
    {
      $set: {
        email: 'researcher_demo@polar.test',
        username: 'researcher_demo',
        password_hash: passwordHash,
        name: 'Dr. Neha Sharma (Demo)',
        role: 'researcher',
        institution: 'NCPOR National Centre for Polar and Ocean Research',
        designation: 'Senior Cryosphere Scientist',
        updated_at: new Date().toISOString()
      },
      $setOnInsert: { created_at: new Date().toISOString() }
    },
    { upsert: true }
  );

  // 3. Admin User
  const adminPasswordHash = await hashPassword('Hello@2006');
  await db.collection('users').updateOne(
    { email: 'admin@gmail.com' },
    {
      $set: {
        email: 'admin@gmail.com',
        username: 'admin',
        password_hash: adminPasswordHash,
        name: 'Admin',
        role: 'admin',
        institution: 'Ministry of Earth Sciences (MoES India)',
        designation: 'Chief Scientific Administrator',
        updated_at: new Date().toISOString()
      },
      $setOnInsert: { created_at: new Date().toISOString() }
    },
    { upsert: true }
  );

  // 4. Sample Pending Submissions
  const existingPending = await db.collection('dataset_submissions').countDocuments({ status: 'pending' });
  if (existingPending === 0) {
    await db.collection('dataset_submissions').insertMany([
      {
        submission_id: 'SUB-940211',
        title: 'Larsemann Hills Coastal Ice Shelf Basal Melt & CTD Profiles',
        category: '02_scientific',
        discipline: '02_scientific',
        description: 'Multi-season conductivity, temperature, and depth (CTD) hydrographic measurements beneath the fast ice adjacent to Bharati Station.',
        file_url: 'https://huggingface.co/datasets/aryansankaliya/sih26063-polar-data/resolve/main/02_scientific/ocean/ocean_bundle.zip',
        file_format: 'CSV',
        researcher_name: 'Dr. Ramesh Chandra',
        researcher_email: 'rchandra@ncpor.res.in',
        institution: 'NCPOR Goa Marine Science Division',
        status: 'pending',
        parameters: ['Temperature', 'Salinity', 'Density', 'Acoustic Backscatter'],
        temporal_coverage: '2023-2025',
        spatial_coverage: '69.4° S, 76.2° E',
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 24).toISOString()
      },
      {
        submission_id: 'SUB-940212',
        title: 'Himadri High-Arctic Kongsfjorden Wind Vector Radar Series',
        category: '01_Weather',
        discipline: '01_Weather',
        description: 'Doppler sodar boundary-layer wind speed profiles and katabatic funneling dynamics across Svalbard fjord corridor.',
        file_url: 'https://huggingface.co/datasets/aryansankaliya/sih26063-polar-data/resolve/main/01_Weather/csv_file/csv_file_bundle.zip',
        file_format: 'ZIP',
        researcher_name: 'Dr. Priya V. Nair',
        researcher_email: 'pnair@imd.gov.in',
        institution: 'India Meteorological Department (IMD)',
        status: 'pending',
        parameters: ['Wind Vector', 'Boundary Layer Height', 'Turbulent Kinetic Energy'],
        temporal_coverage: '2024-2025',
        spatial_coverage: '78.9° N, 11.9° E',
        created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 12).toISOString()
      }
    ]);
    console.log('Seeded 2 initial pending dataset submissions.');
  }

  console.log('RBAC Demo Data seeded successfully!');
  await closeDatabase();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
