---
url: "https://lenco-api.readme.io/v2.0/reference/initiate-collection-from-mobile-money"
title: "/collections/mobile-money"
---

[Jump to Content](https://lenco-api.readme.io/v2.0/reference/initiate-collection-from-mobile-money#content)

[![Lenco API](https://files.readme.io/cf066d0-small-512.jpg)](https://lenco.co/)

[API Reference](https://lenco-api.readme.io/v2.0/reference) v1.0v2.0

* * *

[Log In](https://lenco-api.readme.io/login?redirect_uri=/reference/initiate-collection-from-mobile-money) [![Lenco API](https://files.readme.io/cf066d0-small-512.jpg)](https://lenco.co/)

API Reference

[Log In](https://lenco-api.readme.io/login?redirect_uri=/v2.0/reference/initiate-collection-from-mobile-money)

v2.0

API Reference

/collections/mobile-money

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

# /collections/mobile-money

Ask AI

post

https://api.lenco.co/access/v2/collections/mobile-money

This endpoint allows you to request a payment from customers by using their phone number enabled for mobile money.

At the point of payment, the customer is required to authorize the payment on their mobile phones. The status of the collection request would be `pay-offline`.

Once you get this status, you should notify the customer to complete the authorization process on their mobile phones and then listen for webhook notification or requery the [collection request status endpoint](https://lenco-api.readme.io/v2.0/reference/get-collection-by-reference) at interval.

Response Schema:

JSON

```json
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
	    "type": "mobile-money",
	    "status": "pending" | "successful" | "failed" | "pay-offline",
	    "source": "api",
	    "reasonForFailure": string | null,
	    "settlementStatus": "pending" | "settled" | null,
	    "settlement": null,
	    "mobileMoneyDetails": {
	        "country": string,
	        "phone": string,
	        "operator": string,
	        "accountName": string | null,
	        "operatorTransactionId": string | null,
	    } | null,
	    "bankAccountDetails": null,
	    "cardDetails": null,
	}
}
```

> ## 📘
>
> You can use any of the accounts [listed here](https://lenco-api.readme.io/v2.0/reference/test-cards-and-accounts) to test mobile money collections in the sandbox environment

Language

ShellNodeRubyPHPPython

Credentials

Header

Header

[Log in to use your API keys](https://lenco-api.readme.io/login?redirect_uri=/v2.0/reference/initiate-collection-from-mobile-money)