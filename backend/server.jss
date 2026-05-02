const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

/* ================================
   Zachary Smith 
================================ */
const APP_NAME = "Farm Command Center";

/* ================================
   pk_live_51TQruB2Kn50p5kDTqzaYXNb1vg7GRSyD694IZ3GszBMGNIrp7HOcPNNhOQECEvZfTPreoe5lXuOYPovtzhBlYvhB00in8Z1JBy================================ */
const stripe = require('stripe')';

/* ================================
   ROOT TEST
================================ */
app.get('/', (req, res) => {
  res.send(`${APP_NAME} API Running`);
});

/* ================================
   FEED CALCULATOR
================================ */
app.post('/feed', (req, res) => {
  const { cows, poundsPerHead } = req.body;

  if (!cows || !poundsPerHead) {
    return res.status(400).json({ error: "Missing data" });
  }

  const totalFeed = cows * poundsPerHead;

  res.json({
    totalFeed
  });
});

/* ================================
   STRIPE CHECKOUT
================================ */
app.post('/create-checkout', async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [{
      price: '$50.00 dollars a month',
      quantity: 1,
    }],
    success_url: 'https://example.com/success',
    cancel_url: 'https://example.com/cancel',
  });

  res.json({ url: session.url });
});

/* ================================
   START SERVER
================================ */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
