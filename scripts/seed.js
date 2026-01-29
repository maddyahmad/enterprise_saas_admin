// Seed script to create initial admin user
import { UserModel, ROLES } from '../libs/db/models/User.js';
import { getDatabase } from '../libs/db/mongodb.js';

async function seed() {
  try {
    console.log('Starting database seed...');
    
    // Ensure database connection
    await getDatabase();
    
    // Create admin user
    const admin = await UserModel.createUser({
      email: 'admin@example.com',
      password: 'Admin123!',
      name: 'System Administrator',
      role: ROLES.ADMIN
    });
    
    console.log('✅ Admin user created:', admin.email);
    
    // Create manager user
    const manager = await UserModel.createUser({
      email: 'manager@example.com',
      password: 'Manager123!',
      name: 'John Manager',
      role: ROLES.MANAGER
    });
    
    console.log('✅ Manager user created:', manager.email);
    
    // Create regular user
    const user = await UserModel.createUser({
      email: 'user@example.com',
      password: 'User123!',
      name: 'Jane User',
      role: ROLES.USER
    });
    
    console.log('✅ Regular user created:', user.email);
    
    console.log('\n🎉 Database seeded successfully!');
    console.log('\nLogin credentials:');
    console.log('Admin: admin@example.com / Admin123!');
    console.log('Manager: manager@example.com / Manager123!');
    console.log('User: user@example.com / User123!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
}

seed();
