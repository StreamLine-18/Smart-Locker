import { NextResponse } from 'next/server';
import { db, admin } from '../../../../lib/firebase';
import midtransClient from 'midtrans-client';

export async function POST(req) {
  try {
    console.log('Memproses permintaan POST ke /api/payment/webhook');
    const startTime = Date.now();
    const { order_id, transaction_status, transaction_id } = await req.json();

    if (!order_id || !transaction_status) {
      return NextResponse.json(
        { error: 'Field wajib tidak lengkap: order_id, transaction_status' },
        { status: 400 }
      );
    }

    if (!process.env.MIDTRANS_SERVER_KEY) {
      throw new Error('MIDTRANS_SERVER_KEY tidak dikonfigurasi');
    }

    const snap = new midtransClient.Snap({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY,
    });

    const transaction = await snap.transaction.status(order_id);
    const orderRef = db.collection('orders').doc(order_id);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return NextResponse.json(
        { error: `Pesanan ${order_id} tidak ditemukan` },
        { status: 404 }
      );
    }

    const batch = db.batch();
    const rtDb = admin.database(); // Firebase Realtime Database
    if (transaction.transaction_status === 'settlement' || transaction.transaction_status === 'capture') {
      batch.update(orderRef, {
        orderStatus: 'confirmed',
        paymentStatus: 'success',
        transactionId: transaction_id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const paymentId = transaction_id;
      batch.set(db.collection('payments').doc(paymentId), {
        paymentId: paymentId,
        orderId: order_id,
        transactionId: transaction_id,
        amount: orderDoc.data().totalAmount,
        status: 'settlement',
        paymentMethod: transaction.payment_type || 'unknown',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      batch.set(db.collection('invoices').doc(paymentId), {
        invoiceId: paymentId,
        orderId: order_id,
        paymentId: paymentId,
        invoiceUrl: `${
          process.env.MIDTRANS_SUCCESS_URL || 'https://backend-smartlocker.vercel.app/invoice'
        }?orderId=${order_id}`,
        status: 'paid',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const orderDetailsSnapshot = await db.collection('order_details').where('orderId', '==', order_id).get();
      for (const doc of orderDetailsSnapshot.docs) {
        const lockerId = doc.data().lockerId;
        const lockerRef = db.collection('lockers').doc(lockerId);
        const lockerDoc = await lockerRef.get();
        if (lockerDoc.exists) {
          batch.update(lockerRef, {
            bookingStatus: 'booked',
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
            lastUser: orderDoc.data().uid,
            currentOrderId: order_id,
          });
          // Update Realtime Database
          await rtDb.ref(`lockers/${lockerId}`).update({
            bookingStatus: 'booked',
            lastUpdated: admin.database.ServerValue.TIMESTAMP,
            lastUser: orderDoc.data().uid,
            currentOrderId: order_id,
          });
          console.log(`Webhook: bookingStatus untuk loker ${lockerId} diperbarui ke booked di Realtime Database`);
        }
      }
    } else if (['deny', 'cancel', 'expire'].includes(transaction.transaction_status)) {
      batch.update(orderRef, {
        orderStatus: 'cancelled',
        paymentStatus: 'failed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const orderDetailsSnapshot = await db.collection('order_details').where('orderId', '==', order_id).get();
      for (const doc of orderDetailsSnapshot.docs) {
        const lockerId = doc.data().lockerId;
        const lockerRef = db.collection('lockers').doc(lockerId);
        const lockerDoc = await lockerRef.get();
        if (lockerDoc.exists) {
          batch.update(lockerRef, {
            bookingStatus: 'available',
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
            lastUser: null,
            currentOrderId: null,
          });
          // Update Realtime Database
          await rtDb.ref(`lockers/${lockerId}`).update({
            bookingStatus: 'available',
            lastUpdated: admin.database.ServerValue.TIMESTAMP,
            lastUser: null,
            currentOrderId: null,
          });
          console.log(`Webhook: bookingStatus untuk loker ${lockerId} diperbarui ke available di Realtime Database`);
        }
        batch.delete(doc.ref);
      }
      batch.delete(orderRef);
    }

    await batch.commit();
    const duration = Date.now() - startTime;
    console.log(`Webhook untuk order_id ${order_id} diproses dalam ${duration}ms`);
    return NextResponse.json({ status: 'sukses' }, { status: 200 });
  } catch (error) {
    console.error('Gagal memproses webhook:', error);
    return NextResponse.json({ error: 'Gagal memproses webhook: ' + error.message }, { status: 500 });
  }
}