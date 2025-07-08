import { NextResponse } from 'next/server';
import midtransClient from 'midtrans-client';

export async function GET(request, { params }) {
  try {
    console.log('Memproses permintaan GET ke /api/payment/status/[orderId]');
    const startTime = Date.now();
    const orderId = params.orderId;
    if (!orderId) {
      console.log('OrderId tidak disediakan');
      return NextResponse.json(
        { error: 'orderId diperlukan' },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      );
    }
    console.log(`Mengambil status transaksi untuk orderId: ${orderId}`);
    if (!process.env.MIDTRANS_SERVER_KEY || !process.env.MIDTRANS_CLIENT_KEY) {
      console.error('Variabel lingkungan MIDTRANS_SERVER_KEY atau MIDTRANS_CLIENT_KEY tidak dikonfigurasi');
      throw new Error('Konfigurasi Midtrans tidak lengkap');
    }
    const snap = new midtransClient.Snap({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
    });

    const status = await snap.transaction.status(orderId);
    const duration = Date.now() - startTime;
    console.log(`Status transaksi untuk orderId ${orderId} diperoleh dalam ${duration}ms:`, JSON.stringify(status, null, 2));
    return NextResponse.json(
      status,
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  } catch (error) {
    console.error('Gagal mengambil status transaksi untuk orderId:', params.orderId, error);
    if (error.httpStatusCode === '404' || error.message.includes('404')) {
      console.log(`Transaksi untuk orderId ${params.orderId} tidak ditemukan di Midtrans`);
      return NextResponse.json(
        { error: 'Transaksi tidak ditemukan', status: 'not_found' },
        {
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      );
    }
    return NextResponse.json(
      { error: 'Gagal mengambil status transaksi: ' + error.message },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}