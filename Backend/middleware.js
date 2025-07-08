import { NextResponse } from 'next/server';

export function middleware(request) {
  console.log(`Middleware: Handling ${request.method} request for ${request.url}`);
  const response = NextResponse.next();
  response.headers.set('Access-Control-Allow-Origin', 'http://127.0.0.1:8080');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204 });
  }

  return response;
}

export const config = {
  matcher: '/api/:path*',
};