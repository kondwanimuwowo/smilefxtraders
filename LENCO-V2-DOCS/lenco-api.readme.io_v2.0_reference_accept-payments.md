---
url: "https://lenco-api.readme.io/v2.0/reference/accept-payments"
title: "Accept Payments"
---

[Jump to Content](https://lenco-api.readme.io/v2.0/reference/accept-payments#content)

[![Lenco API](https://files.readme.io/cf066d0-small-512.jpg)](https://lenco.co/)

[API Reference](https://lenco-api.readme.io/v2.0/reference) v1.0v2.0

* * *

[Log In](https://lenco-api.readme.io/login?redirect_uri=/reference/accept-payments) [![Lenco API](https://files.readme.io/cf066d0-small-512.jpg)](https://lenco.co/)

API Reference

[Log In](https://lenco-api.readme.io/login?redirect_uri=/v2.0/reference/accept-payments)

v2.0

API Reference

Accept Payments

JUMP TO

## Lenco API

- [Welcome to Lenco's API doc](https://lenco-api.readme.io/v2.0/reference/introduction)
- [Getting Started](https://lenco-api.readme.io/v2.0/reference/get-started)
- [Accept Payments](https://lenco-api.readme.io/v2.0/reference/accept-payments)
  - [Test Cards and Accounts](https://lenco-api.readme.io/v2.0/reference/test-cards-and-accounts)
- [Accounts](https://lenco-api.readme.io/v2.0/reference/get-accounts)
  - [/accountsget](https://lenco-api.readme.io/v2.0/reference/get-accounts)
  - [/accounts/:idget](https://lenco-api.readme.io/v2.0/reference/get-account-by-id)
  - [/accounts/:id/balanceget](https://lenco-api.readme.io/v2.0/reference/get-account-balance)
- [Banks](https://lenco-api.readme.io/v2.0/reference/get-banks)
  - [/banksget](https://lenco-api.readme.io/v2.0/reference/get-banks)
- [Resolve Account](https://lenco-api.readme.io/v2.0/reference/resolve-bank-account)
  - [/resolve/bank-accountpost](https://lenco-api.readme.io/v2.0/reference/resolve-bank-account)
  - [/resolve/mobile-moneypost](https://lenco-api.readme.io/v2.0/reference/resolve-mobile-money-account)
  - [/resolve/lenco-moneypost](https://lenco-api.readme.io/v2.0/reference/resolve-lenco-money-account)
  - [/resolve/lenco-merchantpost](https://lenco-api.readme.io/v2.0/reference/resolve-lenco-merchant-account)
- [Transfer Recipients](https://lenco-api.readme.io/v2.0/reference/get-transfer-recipients)
  - [/transfer-recipientsget](https://lenco-api.readme.io/v2.0/reference/get-transfer-recipients)
  - [/transfer-recipients/:idget](https://lenco-api.readme.io/v2.0/reference/get-transfer-recipient-by-id)
  - [/transfer-recipients/bank-accountpost](https://lenco-api.readme.io/v2.0/reference/create-transfer-recipient-as-bank-account)
  - [/transfer-recipients/mobile-moneypost](https://lenco-api.readme.io/v2.0/reference/create-transfer-recipient-as-mobile-money)
  - [/transfer-recipients/lenco-moneypost](https://lenco-api.readme.io/v2.0/reference/create-transfer-recipient-as-lenco-money)
  - [/transfer-recipients/lenco-merchantpost](https://lenco-api.readme.io/v2.0/reference/create-transfer-recipient-as-lenco-merchant)
- [Transfers](https://lenco-api.readme.io/v2.0/reference/get-transfers)
  - [/transfersget](https://lenco-api.readme.io/v2.0/reference/get-transfers)
  - [/transfers/:idget](https://lenco-api.readme.io/v2.0/reference/get-transfer-by-id)
  - [/transfers/status/:referenceget](https://lenco-api.readme.io/v2.0/reference/get-transfer-by-reference)
  - [/transfers/bank-accountpost](https://lenco-api.readme.io/v2.0/reference/initiate-transfer-to-bank-account)
  - [/transfers/mobile-moneypost](https://lenco-api.readme.io/v2.0/reference/initiate-transfer-to-mobile-money)
  - [/transfers/lenco-moneypost](https://lenco-api.readme.io/v2.0/reference/initiate-transfer-to-lenco-money)
  - [/transfers/lenco-merchantpost](https://lenco-api.readme.io/v2.0/reference/initiate-transfer-to-lenco-merchant)
  - [/transfers/accountpost](https://lenco-api.readme.io/v2.0/reference/initiate-transfer-to-account)
- [Collections](https://lenco-api.readme.io/v2.0/reference/get-collections)
  - [/collectionsget](https://lenco-api.readme.io/v2.0/reference/get-collections)
  - [/collections/:idget](https://lenco-api.readme.io/v2.0/reference/get-collection-by-id)
  - [/collections/status/:referenceget](https://lenco-api.readme.io/v2.0/reference/get-collection-by-reference)
  - [/collections/mobile-moneypost](https://lenco-api.readme.io/v2.0/reference/initiate-collection-from-mobile-money)
  - [/collections/cardpost](https://lenco-api.readme.io/v2.0/reference/initiate-collection-from-card)
- [Settlements](https://lenco-api.readme.io/v2.0/reference/get-settlements)
  - [/settlementsget](https://lenco-api.readme.io/v2.0/reference/get-settlements)
  - [/settlements/:idget](https://lenco-api.readme.io/v2.0/reference/get-settlement-by-id)
- [Transactions](https://lenco-api.readme.io/v2.0/reference/get-transactions)
  - [/transactionsget](https://lenco-api.readme.io/v2.0/reference/get-transactions)
  - [/transactions/:idget](https://lenco-api.readme.io/v2.0/reference/get-transaction-by-id)
- [Webhooks](https://lenco-api.readme.io/v2.0/reference/webhooks)
- [Encryption](https://lenco-api.readme.io/v2.0/reference/encryption)
  - [/encryption-keyget](https://lenco-api.readme.io/v2.0/reference/get-encryption-key)

Powered by [ReadMe](https://readme.com/?ref_src=hub&project=lenco-api)

1. Lenco API

# Accept Payments

Ask AI

Lenco provides a simple and convenient payment flow for web with the popup widget. It can be integrated in a few easy steps.

### Step 1: Collect customer information   [Skip link to Step 1: Collect customer information](https://lenco-api.readme.io/v2.0/reference/accept-payments\#step-1-collect-customer-information)

To begin, you need to pass information such as email, amount, reference, etc.

Here is the full list of parameters you can pass:

| Param | Required? | Description |
| --- | --- | --- |
| key | Yes | Your public key from Lenco |
| email | Yes | Email address of customer |
| reference | Yes | Unique case sensitive reference. Only `-`, `.`, `_`, and alphanumeric characters allowed |
| amount | Yes | Amount the customer is to pay. This can include decimals (i.e. 10.75) |
| currency | No | ISO 3-Letter Currency Code e.g. `ZMW`, `USD` |
| label | No | Text to show on the widget. This could be the name of the checkout form. |
| bearer | No | Decide who will bear the fee. Either `merchant` (you), or `customer` (your customer).<br>Note: This will only be used if not already set in your dashboard. |
| channels | No | An array of payment channels to control what is made available to the customer to make a payment with.<br>Available channels include: \[`card`, `mobile-money`\] |
| customer | No | This field holds the customer details |
| customer.firstName | No | The first name of the customer |
| customer.lastName | No | The last name of the customer |
| customer.phone | No | The phone number of the customer |
| billing | No | This field holds the customer's billing address |
| billing.streetAddress | No | The street address |
| billing.city | No | The city |
| billing.state | No | The state or province.<br>If a country does not have states or provinces, this can be left blank.<br>Note: For US states and Canada provinces, this should be the 2-letter code for the state / province. i.e. California should be `CA`.<br>You can find the list of US State and Canada Province codes [here](https://www.ups.com/worldshiphelp/WSA/ENU/AppHelp/mergedProjects/CORE/Codes/State_Province_Codes.htm) |
| billing.postalCode | No | The postal code |
| billing.country | No | 2-letter code i.e. United states should be `US`.<br>You can find the list of country codes [here](https://www.iban.com/country-codes) |
| onSuccess | No | Javascript function that runs when payment is successful. This should ideally be a script that uses the verify endpoint to check the status of the payment. |
| onClose | No | Javascript function that is called if the customer closes the payment window instead of making a payment. |
| onConfirmationPending | No | Javascript function that is called if the customer closes the payment window before we verify their payment. |

### Step 2: Initiate the Payment   [Skip link to Step 2: Initiate the Payment](https://lenco-api.readme.io/v2.0/reference/accept-payments\#step-2-initiate-the-payment)

When you have all the details needed to initiate the payment, the next step is to pass them to Lenco to display the popup widget.

HTML

```html
<script src="https://pay.lenco.co/js/v1/inline.js"></script>

<script>
function getPaidWithLenco() {
	LencoPay.getPaid({
		key: 'YOUR_PUBLIC_KEY', // your Lenco public key
		reference: 'ref-' + Date.now(), // a unique reference you generated
		email: 'customer@email.com', // the customer's email address
		amount: 1000, // the amount the customer is to pay
		currency: "ZMW",
		channels: ["card", "mobile-money"],
		customer: {
			firstName: "John",
			lastName: "Doe",
			phone: "0971111111",
		},
		onSuccess: function (response) {
			//this happens after the payment is completed successfully
			const reference = response.reference;
			alert('Payment complete! Reference: ' + reference);
			// Make an AJAX call to your server with the reference to verify the payment
		},
		onClose: function () {
			alert('Payment was not completed, window closed.');
		},
		onConfirmationPending: function () {
			alert('Your purchase will be completed when the payment is confirmed');
		},
	});
}
</script>
```

For the sandbox environment, use `https://pay.sandbox.lenco.co/js/v1/inline.js` as the source for the lenco widget script.

**Important Notes:**

1. The `key` field takes your Lenco **public** key.
2. The `amount` field should not be converted to the lowest currency unit. Rather you can pass in a number with decimal places i.e. 10.75
3. It is ideal to generate a unique reference from your system for every payment to avoid duplicate attempts.
4. The `onSuccess` callback function is called when payment has been completed successfully. See the next section for how to handle the callback.
5. The `onClose` callback function is called if the user closes the widget without completing payment.
6. The `onConfirmationPending` callback function is called if the customer closes the payment window before we verify their payment.

### Step 3: Handle the `onSuccess` callback method   [Skip link to Step 3: Handle the ](https://lenco-api.readme.io/v2.0/reference/accept-payments\#step-3-handle-the-onsuccess-callback-method)

The `onSuccess` callback function is fired when the payment is successful. This is where you include any action you want to perform when the payment is successful.

The recommended next step here is to verify the payment as detailed in step 4.

> ## 📘
>
> **Note**
>
> To verify the payment, you have to set up a route or page on your server that you pass the reference to. Then from your server, you call the verify endpoint to confirm the statis of the payment, and the response is returned to your frontend.

There are 2 ways you can call your server from the callback function

1. Make an AJAX request to the endpoint on your server that handles the payment verification

JavaScript

```javascript
onSuccess: function(response){
	$.ajax({
		url: 'https://www.yoururl.com/verify_payment?reference=' + response.reference,
		method: 'get',
		success: function (response) {
			// the payment status is in response.data.status
		}
	});
}
```

2. Redirect to the verification endpoint URL on your server.

JavaScript

```javascript
onSuccess: function(response) {
	window.location = "https://www.yoururl.com/verify_payment.php?reference=" + response.reference;
}
// On the redirected page, you can call Lenco's API to verify the payment.
```

> ## ❗️
>
> **Warning**
>
> Never call the Lenco API directly from your frontend to avoid exposing your api secret key on the frontend. All requests to the Lenco API should be initiated from your server, and your frontend gets the response from your server.

### Step 4: Verify the Payment   [Skip link to Step 4: Verify the Payment](https://lenco-api.readme.io/v2.0/reference/accept-payments\#step-4-verify-the-payment)

You do this by making a GET request to `https://api.lenco.co/access/v2/collections/status/:reference` from your server using your reference. You can find more information about this endpoint [here](https://lenco-api.readme.io/v2.0/reference/get-collection-by-reference).

cURL

```curl
# Sample Request

curl https://api.lenco.co/access/v2/collections/status/ref-1
-H "Authorization: Bearer API_SECRET_KEY"
-X GET
```

JSON

```json
// Sample Response

{
  "status": true,
  "message": "",
  "data": {
    "id": "d7bd9ccb-0737-4e72-a387-d00454341f21",
    "initiatedAt": "2024-03-12T07:06:11.562Z",
    "completedAt": "2024-03-12T07:14:10.412Z",
    "amount": "10.00",
    "fee": "0.25",
    "bearer": "merchant",
    "currency": "ZMW",
    "reference": "ref-1",
    "lencoReference": "240720004",
    "type": "mobile-money",
    "status": "successful",
    "source": "api",
    "reasonForFailure": null,
    "settlementStatus": "settled",
    "settlement": {
      "id": "c04583d7-d026-4dfa-b8b5-e96f17f93bb8",
      "amountSettled": "9.75",
      "currency": "ZMW",
      "createdAt": "2024-03-12T07:14:10.439Z",
      "settledAt": "2024-03-12T07:14:10.496Z",
      "status": "settled",
      "type": "instant",
      "accountId": "68f11209-451f-4a15-bfcd-d916eb8b09f4"
    },
    "mobileMoneyDetails": {
      "country": "zm",
      "phone": "0977433571",
      "operator": "airtel",
      "accountName": "Beata Jean",
      "operatorTransactionId": "MP240312.0000.A00001"
    },
    "bankAccountDetails": null,
    "cardDetails": null
  }
}
```

### Step 5: Handle webhook   [Skip link to Step 5: Handle webhook](https://lenco-api.readme.io/v2.0/reference/accept-payments\#step-5-handle-webhook)

When a payment is successful, Lenco sends a `collection.successful` webhook event to your webhook URL. You can [learn more here](https://lenco-api.readme.io/v2.0/reference/webhooks).