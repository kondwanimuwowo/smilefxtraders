---
url: "https://lenco-api.readme.io/v2.0/reference/initiate-collection-from-card"
title: "/collections/card"
---

[Jump to Content](https://lenco-api.readme.io/v2.0/reference/initiate-collection-from-card#content)

[![Lenco API](https://files.readme.io/cf066d0-small-512.jpg)](https://lenco.co/)

[API Reference](https://lenco-api.readme.io/v2.0/reference) v1.0v2.0

* * *

[Log In](https://lenco-api.readme.io/login?redirect_uri=/reference/initiate-collection-from-card) [![Lenco API](https://files.readme.io/cf066d0-small-512.jpg)](https://lenco.co/)

API Reference

[Log In](https://lenco-api.readme.io/login?redirect_uri=/v2.0/reference/initiate-collection-from-card)

v2.0

API Reference

/collections/card

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

# /collections/card

Ask AI

post

https://api.lenco.co/access/v2/collections/card

> ## 📘  PCI DSS required
>
> Using this endpoint involves dealing with cardholder Personally Identifying Information (PII). A Payment Card Industry Data Security Standard (PCI DSS) certificate is therefore required.

This endpoint allows you to request a payment from customers by charging their debit/credit cards.

You send the customer details along with the card and billing information.

**Request**

The request payload would be encrypted. Please follow the guide [here](https://lenco-api.readme.io/v2.0/reference/encryption).

The parameters you can use to build the request payload are given below:

| Param | Required? | Description |
| --- | --- | --- |
| email | Yes | Email address of customer |
| reference | Yes | Unique case sensitive reference. Only `-`, `.`, `_`, and alphanumeric characters allowed |
| amount | Yes | Amount the customer is to pay. This can include decimals (i.e. 10.75) |
| currency | Yes | ISO 3-Letter Currency Code e.g. `ZMW`, `USD` |
| bearer | No | Decide who will bear the fee. Either `merchant` (you), or `customer` (your customer).<br>Note: This will only be used if not already set in your dashboard. |
| customer | Yes | This field holds the customer details |
| customer.firstName | Yes | The first name of the customer |
| customer.lastName | Yes | The last name of the customer |
| billing | Yes | This field holds the customer's billing address |
| billing.streetAddress | Yes | The street address |
| billing.city | Yes | The city |
| billing.state | No | The state or province.<br>If a country does not have states or provinces, this can be left blank.<br>Note: For US states and Canada provinces, this should be the 2-letter code for the state / province. i.e. California should be `CA`.<br>You can find the list of US State and Canada Province codes [here](https://www.ups.com/worldshiphelp/WSA/ENU/AppHelp/mergedProjects/CORE/Codes/State_Province_Codes.htm) |
| billing.postalCode | Yes | The postal code |
| billing.country | Yes | 2-letter code i.e. United states should be `US`.<br>You can find the list of country codes [here](https://www.iban.com/country-codes) |
| card | Yes | This field holds the card details |
| card.number | Yes | Card PAN |
| card.expiryMonth | Yes | Card expiry month |
| card.expiryYear | Yes | Card expiry year |
| card.cvv | Yes | Card security code |
| redirectUrl | No | The customer will be redirected to this url after completing the payment.<br>Your `reference`, `lencoReference`, `status`, and an optional `errorMessage` will be appended as query parameters to the redirectUrl |

JSON

```json
// Sample payload to be encrypted

{
  "reference": "test-1",
  "email": "customer@email.com",
  "amount": "1000",
  "currency": "ZMW",
  "bearer": "merchant",
  "customer": {
    "firstName": "John",
    "lastName": "Doe"
  },
  "billing": {
    "streetAddress": "901 metro center blvd",
    "city": "San Francisco",
    "state": "CA",
    "postalCode": "94404",
    "country": "US"
  },
  "card": {
    "number": "5555 5555 5555 4444",
    "cvv": "838",
    "expiryMonth": "12",
    "expiryYear": "2024"
  },
  "redirectUrl": "https://www.yoururl.com/verify_payment"
}
```

**Response**

For cards that require 3D Secure authorization, the value of `data`.`status` would be "3ds-auth-required" and the response would include an `authorization` object in the `meta` key.

This `authorization` object would contain a `mode` key which will be "redirect", and a `redirect` key.

You should redirect your customer to the URL specified in `meta`.`authorization`.`redirect` to complete the 3DS authorization.

JSON

```json
// Response Schema

{
    "status": boolean,
    "message": string,
    "data": {
	    "id": string,
	    "initiatedAt": date-time,
	    "completedAt": date-time | null,
	    "amount": string,
	    "fee": string | null,
	    "bearer": "merchant" | "customer",
	    "currency": string,
	    "reference": string,
	    "lencoReference": string,
	    "type": "card",
	    "status": "pending" | "successful" | "failed" | "3ds-auth-required",
	    "source": "api",
	    "reasonForFailure": string | null,
	    "settlementStatus": "pending" | "settled" | null,
	    "settlement": null,
	    "mobileMoneyDetails": null,
	    "bankAccountDetails": null,
	    "cardDetails": {
	        "firstName": string | null,
	        "lastName": string | null,
	        "bin": string | null,
	        "last4": string | null,
	        "cardType": string | null,
	    } | null,
	    "meta": { // optional
	        "authorization": {
	            "mode": "redirect",
	            "redirect": string
	        }
	    }
	}
}
```

> ## 📘
>
> You can use any of the cards [listed here](https://lenco-api.readme.io/v2.0/reference/test-cards-and-accounts) to test card collections in the sandbox environment

Language

ShellNodeRubyPHPPython

Credentials

Header

Header

[Log in to use your API keys](https://lenco-api.readme.io/login?redirect_uri=/v2.0/reference/initiate-collection-from-card)