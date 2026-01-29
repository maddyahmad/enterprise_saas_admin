import { verifyToken } from './jwt';
import { UserModel } from '../db/models/User';
import { headers } from 'next/headers';

export async function authenticateRequest(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authenticated: false, error: 'No token provided' };
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return { authenticated: false, error: 'Invalid token' };
    }

    // Get user from database
    const user = await UserModel.findById(decoded.userId);
    
    if (!user) {
      return { authenticated: false, error: 'User not found' };
    }

    if (user.status !== 'active') {
      return { authenticated: false, error: 'User account is not active' };
    }

    return { 
      authenticated: true, 
      user,
      userId: user.id,
      role: user.role
    };
  } catch (error) {
    return { authenticated: false, error: error.message };
  }
}

export function requireAuth(allowedRoles = null) {
  return async (request) => {
    const auth = await authenticateRequest(request);
    
    if (!auth.authenticated) {
      return {
        authorized: false,
        error: auth.error || 'Unauthorized'
      };
    }

    // Check role-based access
    if (allowedRoles && !allowedRoles.includes(auth.role)) {
      return {
        authorized: false,
        error: 'Insufficient permissions'
      };
    }

    return {
      authorized: true,
      user: auth.user,
      userId: auth.userId,
      role: auth.role
    };
  };
}
