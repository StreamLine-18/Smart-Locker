/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    MIDTRANS_SUCCESS_URL: process.env.MIDTRANS_SUCCESS_URL || 'http://localhost:3000/finish',
    MIDTRANS_UNFINISH_URL: process.env.MIDTRANS_UNFINISH_URL || 'http://localhost:3000/unfinish',
    MIDTRANS_ERROR_URL: process.env.MIDTRANS_ERROR_URL || 'http://localhost:3000/error',
  },
};

export default nextConfig;
