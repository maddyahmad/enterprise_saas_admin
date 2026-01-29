import { NextResponse } from 'next/server';
import { UserModel, ROLES } from '@/libs/db/models/User';
import { AuditLogModel } from '@/libs/db/models/AuditLog';
import { SessionModel } from '@/libs/db/models/Session';
import { generateToken } from '@/libs/auth/jwt';
import { authenticateRequest, requireAuth } from '@/libs/auth/middleware';
import { getClientIp, getUserAgent } from '@/libs/shared/utils';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// OPTIONS handler for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// ============= AUTH ROUTES =============

async function handleRegister(request) {
  try {
    const body = await request.json();
    const { email, password, name, role } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const user = await UserModel.createUser({
      email,
      password,
      name,
      role: role || ROLES.USER
    });

    // Create audit log
    await AuditLogModel.createLog({
      userId: user.id,
      action: 'user_registered',
      resource: 'auth',
      details: { email: user.email },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request)
    });

    return NextResponse.json(
      { message: 'User registered successfully', user },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400, headers: corsHeaders }
    );
  }
}

async function handleLogin(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const user = await UserModel.findByEmail(email);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401, headers: corsHeaders }
      );
    }

    const isValidPassword = await UserModel.verifyPassword(password, user.password);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401, headers: corsHeaders }
      );
    }

    if (user.status !== 'active') {
      return NextResponse.json(
        { error: 'Account is not active' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Update last login
    await UserModel.updateLastLogin(user.id);

    // Create session
    const session = await SessionModel.createSession({
      userId: user.id,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request)
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id
    });

    // Create audit log
    await AuditLogModel.createLog({
      userId: user.id,
      action: 'user_login',
      resource: 'auth',
      details: { email: user.email },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request)
    });

    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { 
        message: 'Login successful',
        token,
        user: userWithoutPassword
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

async function handleGetMe(request) {
  try {
    const auth = await authenticateRequest(request);
    
    if (!auth.authenticated) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { user: auth.user },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

async function handleLogout(request) {
  try {
    const auth = await authenticateRequest(request);
    
    if (!auth.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Create audit log
    await AuditLogModel.createLog({
      userId: auth.userId,
      action: 'user_logout',
      resource: 'auth',
      details: { email: auth.user.email },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request)
    });

    return NextResponse.json(
      { message: 'Logout successful' },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

// ============= USER ROUTES =============

async function handleGetUsers(request) {
  try {
    const checkAuth = requireAuth(['admin', 'manager']);
    const auth = await checkAuth(request);
    
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 403, headers: corsHeaders }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const result = await UserModel.getAllUsers({ page, limit, role, status, search });

    return NextResponse.json(result, { status: 200, headers: corsHeaders });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

async function handleUpdateUser(request, userId) {
  try {
    const checkAuth = requireAuth(['admin']);
    const auth = await checkAuth(request);
    
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 403, headers: corsHeaders }
      );
    }

    const body = await request.json();
    const updatedUser = await UserModel.updateUser(userId, body);

    // Create audit log
    await AuditLogModel.createLog({
      userId: auth.userId,
      action: 'user_updated',
      resource: 'users',
      details: { targetUserId: userId, updates: body },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request)
    });

    return NextResponse.json(
      { message: 'User updated successfully', user: updatedUser },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

async function handleDeleteUser(request, userId) {
  try {
    const checkAuth = requireAuth(['admin']);
    const auth = await checkAuth(request);
    
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 403, headers: corsHeaders }
      );
    }

    await UserModel.deleteUser(userId);

    // Create audit log
    await AuditLogModel.createLog({
      userId: auth.userId,
      action: 'user_deleted',
      resource: 'users',
      details: { targetUserId: userId },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request)
    });

    return NextResponse.json(
      { message: 'User deleted successfully' },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

// ============= DASHBOARD ROUTES =============

async function handleGetDashboardStats(request) {
  try {
    const checkAuth = requireAuth(['admin', 'manager']);
    const auth = await checkAuth(request);
    
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 403, headers: corsHeaders }
      );
    }

    const userStats = await UserModel.getStats();
    const auditStats = await AuditLogModel.getStats();
    const recentActivity = await AuditLogModel.getRecentActivity(10);

    return NextResponse.json(
      {
        users: userStats,
        activity: auditStats,
        recentActivity
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

// ============= AUDIT LOG ROUTES =============

async function handleGetAuditLogs(request) {
  try {
    const checkAuth = requireAuth(['admin']);
    const auth = await checkAuth(request);
    
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 403, headers: corsHeaders }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const resource = searchParams.get('resource');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const result = await AuditLogModel.getLogs({ 
      page, 
      limit, 
      userId, 
      action, 
      resource, 
      startDate, 
      endDate 
    });

    return NextResponse.json(result, { status: 200, headers: corsHeaders });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

// ============= MAIN ROUTER =============

export async function GET(request, { params }) {
  const path = params.path ? params.path.join('/') : '';

  try {
    // Auth routes
    if (path === 'auth/me') {
      return handleGetMe(request);
    }

    // Dashboard routes
    if (path === 'dashboard/stats') {
      return handleGetDashboardStats(request);
    }

    // User routes
    if (path === 'users') {
      return handleGetUsers(request);
    }

    // Audit log routes
    if (path === 'audit-logs') {
      return handleGetAuditLogs(request);
    }

    return NextResponse.json(
      { error: 'Route not found' },
      { status: 404, headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request, { params }) {
  const path = params.path ? params.path.join('/') : '';

  try {
    // Auth routes
    if (path === 'auth/register') {
      return handleRegister(request);
    }
    if (path === 'auth/login') {
      return handleLogin(request);
    }
    if (path === 'auth/logout') {
      return handleLogout(request);
    }

    return NextResponse.json(
      { error: 'Route not found' },
      { status: 404, headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function PUT(request, { params }) {
  const path = params.path ? params.path.join('/') : '';

  try {
    // User routes
    if (path.startsWith('users/')) {
      const userId = path.split('/')[1];
      return handleUpdateUser(request, userId);
    }

    return NextResponse.json(
      { error: 'Route not found' },
      { status: 404, headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function DELETE(request, { params }) {
  const path = params.path ? params.path.join('/') : '';

  try {
    // User routes
    if (path.startsWith('users/')) {
      const userId = path.split('/')[1];
      return handleDeleteUser(request, userId);
    }

    return NextResponse.json(
      { error: 'Route not found' },
      { status: 404, headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
