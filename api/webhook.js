const crypto = require('crypto');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
  });
}
const db = admin.firestore();
module.exports.config = { api: { bodyParser: false } };

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => data += c);
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const rawBody = await readRawBody(req);
  const signature = req.headers['x-razorpay-signature'];
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest('hex');
  if (signature !== expected) return res.status(400).json({ error: 'Invalid signature' });

  const payload = JSON.parse(rawBody);
  if (payload.event === 'payment.captured') {
    const payment = payload.payload.payment.entity;
    const notes = payment.notes || {};
    const ticketId = notes.ticketId || ('JAD-PUNY26-' + payment.id.slice(-6).toUpperCase());
    await db.collection('bookings').doc(ticketId).set({
      ticketId, name: notes.name || 'Unknown', mobile: notes.mobile || payment.contact || '',
      passes: parseInt(notes.passes || '1', 10), amount: payment.amount / 100,
      paymentRef: payment.id, bookedAt: new Date().toISOString(), checkedIn: false,
    }, { merge: true });
  }
  res.status(200).json({ ok: true });
};
