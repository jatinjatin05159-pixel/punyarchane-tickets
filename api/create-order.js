const Razorpay = require('razorpay');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { amount, name, mobile, passes } = req.body;
    const ticketId = 'JAD-PUNY26-' + Math.random().toString(36).slice(2,7).toUpperCase();
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    const order = await instance.orders.create({
      amount, currency: 'INR', receipt: ticketId,
      notes: { ticketId, name: name || '', mobile: mobile || '', passes: String(passes || '') }
    });
    res.status(200).json({ orderId: order.id, ticketId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
