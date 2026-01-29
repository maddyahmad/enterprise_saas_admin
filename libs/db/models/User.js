import { getDatabase } from '../mongodb';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user'
};

export const ROLE_PERMISSIONS = {
  admin: ['read', 'write', 'delete', 'manage_users', 'view_audit_logs'],
  manager: ['read', 'write', 'manage_team'],
  user: ['read']
};

export class UserModel {
  static async getCollection() {
    const db = await getDatabase();
    return db.collection('users');
  }

  static async createUser({ email, password, name, role = ROLES.USER }) {
    const collection = await this.getCollection();
    
    // Check if user exists
    const existingUser = await collection.findOne({ email });
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
      id: uuidv4(),
      email,
      password: hashedPassword,
      name,
      role,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null
    };

    await collection.insertOne(user);
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async findByEmail(email) {
    const collection = await this.getCollection();
    return await collection.findOne({ email });
  }

  static async findById(id) {
    const collection = await this.getCollection();
    const user = await collection.findOne({ id });
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updateLastLogin(id) {
    const collection = await this.getCollection();
    await collection.updateOne(
      { id },
      { $set: { lastLogin: new Date() } }
    );
  }

  static async getAllUsers({ page = 1, limit = 10, role, status, search }) {
    const collection = await this.getCollection();
    
    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const users = await collection
      .find(query, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await collection.countDocuments(query);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async updateUser(id, updates) {
    const collection = await this.getCollection();
    const allowedUpdates = ['name', 'role', 'status'];
    const filteredUpdates = {};
    
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    filteredUpdates.updatedAt = new Date();

    await collection.updateOne({ id }, { $set: filteredUpdates });
    return await this.findById(id);
  }

  static async deleteUser(id) {
    const collection = await this.getCollection();
    await collection.deleteOne({ id });
  }

  static async getStats() {
    const collection = await this.getCollection();
    
    const total = await collection.countDocuments();
    const activeUsers = await collection.countDocuments({ status: 'active' });
    const adminCount = await collection.countDocuments({ role: ROLES.ADMIN });
    const managerCount = await collection.countDocuments({ role: ROLES.MANAGER });
    const userCount = await collection.countDocuments({ role: ROLES.USER });

    return {
      total,
      active: activeUsers,
      byRole: {
        admin: adminCount,
        manager: managerCount,
        user: userCount
      }
    };
  }
}
