# Stripe — Products, Prices, Webhooks

## Test-mode setup

1. https://dashboard.stripe.com/test/products → **Add product**.
2. Name: "Lumen Membership". Add **two recurring prices**:
   - Monthly: $19/month
   - Annual: $180/year
3. Copy the `price_...` IDs into env:
   ```
   STRIPE_PRICE_MONTHLY=price_...
   STRIPE_PRICE_ANNUAL=price_...
   ```

## Webhooks

Endpoint: `https://<your-domain>/api/webhooks/stripe`

Events to send:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

Save the signing secret to `STRIPE_WEBHOOK_SECRET`.

### Local testing with `stripe listen`

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy the printed whsec_... into STRIPE_WEBHOOK_SECRET in .env.local
```

Then trigger an event:

```bash
stripe trigger customer.subscription.created
```

## Test cards

| Card | Behavior |
|---|---|
| `4242 4242 4242 4242` | Always succeeds |
| `4000 0027 6000 3184` | Requires 3DS authentication |
| `4000 0000 0000 9995` | Card declined |

Use any future expiry and any 3-digit CVC.

## Billing portal

Account page links to the Stripe Billing Portal via `/api/billing-portal`. Make sure
the **Customer portal** is enabled in
https://dashboard.stripe.com/test/settings/billing/portal and that the products you
created above are listed as switchable plans.
