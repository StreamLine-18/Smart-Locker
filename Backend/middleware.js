import { NextResponse } from 'next/server';

const ALLOWED_ORIGINS = process.env.NEXT_PUBLIC_BACKEND_URL
  ? [process.env.NEXT_PUBLIC_BACKEND_URL]
  : ['http://localhost:3000', 'https://backend-smartlocker-d3gq5t8ju-rahadiancondros-projects.vercel.app', 'https://localhost'];

export function middleware(request) {
  try {
    const response = NextResponse.next();
    response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' https://app.sandbox.midtrans.com");
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    const origin = request.headers.get('origin') || '';
    if (ALLOWED_ORIGINS.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;
  } catch (error) {
    console.error('Middleware error:', error.message);
    return NextResponse.json({ error: 'Internal server error in middleware' }, { status: 500 });
  }
}

export const config = {
  matcher: '/api/:path*'
};