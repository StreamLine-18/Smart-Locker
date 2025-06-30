const request = require('supertest');
const app = require('../pages/api/payment/token');

describe('POST /api/payment/token', () => {
  it('mengembalikan token untuk input valid', async () => {
    const res = await request(app)
      .post('/api/payment/token')
      .send({
        orderId: '1750481224371',
        amount: 10000,
        email: 'vimacandraa@gmail.com',
        uid: 'OZ7zGkEwj9WH9ug5Q5vYcGZs4WS2'
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });

  it('mengembalikan error untuk input tidak valid', async () => {
    const res = await request(app)
      .post('/api/payment/token')
      .send({ orderId: '', amount: 0, email: 'invalid' });
    expect(res.statusCode).toEqual(400);
  });
});