import { getDatabase } from '../mongodb';
import { v4 as uuidv4 } from 'uuid';

export class AuditLogModel {
  static async getCollection() {
    const db = await getDatabase();
    return db.collection('audit_logs');
  }

  static async createLog({ userId, action, resource, details, ipAddress, userAgent }) {
    const collection = await this.getCollection();
    
    const log = {
      id: uuidv4(),
      userId,
      action,
      resource,
      details,
      ipAddress,
      userAgent,
      timestamp: new Date()
    };

    await collection.insertOne(log);
    return log;
  }

  static async getLogs({ page = 1, limit = 20, userId, action, resource, startDate, endDate }) {
    const collection = await this.getCollection();
    
    const query = {};
    if (userId) query.userId = userId;
    if (action) query.action = action;
    if (resource) query.resource = resource;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    
    const logs = await collection
      .find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await collection.countDocuments(query);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getRecentActivity(limit = 10) {
    const collection = await this.getCollection();
    return await collection
      .find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  }

  static async getStats() {
    const collection = await this.getCollection();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayLogs = await collection.countDocuments({
      timestamp: { $gte: today }
    });

    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    
    const weekLogs = await collection.countDocuments({
      timestamp: { $gte: last7Days }
    });

    return {
      today: todayLogs,
      last7Days: weekLogs
    };
  }
}
