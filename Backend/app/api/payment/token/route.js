import { NextResponse } from 'next/server';
import midtransClient from 'midtrans-client';

export async function POST(request) {
  try {
    console.log('Memproses permintaan POST ke /api/payment/token');
    const startTime = Date.now();
    const { orderId, amount, email, uid } = await request.json();

    if (!orderId || !amount || !email || !uid) {
      console.log('Parameter tidak lengkap:', { orderId, amount, email, uid });
      return NextResponse.json(
        { error: 'Field wajib tidak lengkap: orderId, amount, email, uid' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      );
    }

    if (amount <= 0) {
      console.log('Jumlah tidak valid:', amount);
      return NextResponse.json(
        { error: 'Jumlah harus lebih besar dari 0' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      );
    }

    if (!process.env.MIDTRANS_SERVER_KEY || !process.env.MIDTRANS_CLIENT_KEY) {
      console.error('Variabel lingkungan MIDTRANS_SERVER_KEY atau MIDTRANS_CLIENT_KEY tidak dikonfigurasi');
      throw new Error('Konfigurasi Midtrans tidak lengkap');
    }

    const snap = new midtransClient.Snap({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
    });

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: Math.round(amount), // Pastikan amount adalah integer
      },
      customer_details: {
        email: email,
        first_name: uid,
      },
      enabled_payments: ['credit_card', 'bank_transfer', 'gopay', 'shopeepay'],
      callbacks: {
        finish: process.env.MIDTRANS_SUCCESS_URL || 'https://backend-smartlocker.vercel.app/finish',
        error: process.env.MIDTRANS_ERROR_URL || 'https://backend-smartlocker.vercel.app/error',
        unfinish: process.env.MIDTRANS_UNFINISH_URL || 'https://backend-smartlocker.vercel.app/unfinish',
      },
    };

    console.log('Parameter transaksi:', JSON.stringify(parameter, null, 2));
    const transaction = await snap.createTransaction(parameter);
    const duration = Date.now() - startTime;
    console.log(`Token Snap untuk orderId ${orderId} dibuat dalam ${duration}ms: ${transaction.token}`);
    return NextResponse.json(
      { token: transaction.token },
      { 
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  } catch (error) {
    console.error('Gagal membuat token Snap:', error);
    return NextResponse.json(
      { error: 'Gagal membuat token Snap: ' + error.message },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}