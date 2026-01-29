import { getDatabase } from '../mongodb';
import { v4 as uuidv4 } from 'uuid';

export class SessionModel {
  static async getCollection() {
    const db = await getDatabase();
    return db.collection('sessions');
  }

  static async createSession({ userId, ipAddress, userAgent }) {
    const collection = await this.getCollection();
    
    const session = {
      id: uuidv4(),
      userId,
      ipAddress,
      userAgent,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };

    await collection.insertOne(session);
    return session;
  }

  static async findById(id) {
    const collection = await this.getCollection();
    return await collection.findOne({ id });
  }

  static async deleteSession(id) {
    const collection = await this.getCollection();
    await collection.deleteOne({ id });
  }

  static async deleteUserSessions(userId) {
    const collection = await this.getCollection();
    await collection.deleteMany({ userId });
  }

  static async cleanExpiredSessions() {
    const collection = await this.getCollection();
    await collection.deleteMany({
      expiresAt: { $lt: new Date() }
    });
  }
}
