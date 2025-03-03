import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const session = request.cookies.get('session');

  if (!session) {
    return new NextResponse(null, {
      status: 401,
      statusText: 'Unauthorized'
    });
  }

  // In a real app, you would verify the session token with your database/auth service
  return new NextResponse(JSON.stringify({ authenticated: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
