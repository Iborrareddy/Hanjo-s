# Hanjo’s Smash Burger

React and Vite restaurant website. Open http://127.0.0.1:4174 when the preview is running.

## Run locally

Install Node.js 20.19+ or 22.12+. From this directory, run:

```sh
npm install
npm run dev
```

Use npm run build to generate the static website in dist/ and npm run preview to serve it.

## Update restaurant details

Edit src/data.js for menu items, prices in cents, optional descriptions, burger options, verified hours, social links, tax rate and fees. A customization price of null is displayed as pending. Set it to 0 only when the option has no additional charge. Single and double burger bases use the listed Classic Smashburger prices. Food imagery is illustrative. The logo file is the original upload.

The cart persists in the current browser. Checkout links to DoorDash and Uber Eats and shows pickup location and click-to-call information. The local cart does not transfer to delivery partners. A future integration should validate the cart, prices, availability and fulfillment with its server before collecting payment.


