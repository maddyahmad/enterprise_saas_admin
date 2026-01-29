export function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
  return ip;
}

export function getUserAgent(request) {
  return request.headers.get('user-agent') || 'unknown';
}

export function sanitizeError(error) {
  if (process.env.NODE_ENV === 'production') {
    return 'An error occurred';
  }
  return error.message || error.toString();
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
