---
url: "https://lenco-api.readme.io/v2.0/reference/get-collection-by-reference"
title: "/collections/status/:reference"
---

[Jump to Content](https://lenco-api.readme.io/v2.0/reference/get-collection-by-reference#content)

[![Lenco API](https://files.readme.io/cf066d0-small-512.jpg)](https://lenco.co/)

[API Reference](https://lenco-api.readme.io/v2.0/reference) v1.0v2.0

* * *

[Log In](https://lenco-api.readme.io/login?redirect_uri=/reference/get-collection-by-reference) [![Lenco API](https://files.readme.io/cf066d0-small-512.jpg)](https://lenco.co/)

API Reference

[Log In](https://lenco-api.readme.io/login?redirect_uri=/v2.0/reference/get-collection-by-reference)

v2.0

API Reference

/collections/status/:reference

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

# /collections/status/:reference

Ask AI

get

https://api.lenco.co/access/v2/collections/status/{reference}

Retrieve information about a specific collection request using the reference of the request

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
	    "reference": string | null,
	    "lencoReference": string,
	    "type": "card" | "mobile-money" | "bank-account" | null,
	    "status": "pending" | "successful" | "failed" | "pay-offline" | "3ds-auth-required",
	    "source": "banking-app" | "api",
	    "reasonForFailure": string | null,
	    "settlementStatus": "pending" | "settled" | null,
	    "settlement": {
	        "id": string,
	        "amountSettled": string,
	        "currency": string,
	        "createdAt": date-time,
	        "settledAt": date-time | null,
	        "status": "pending" | "settled",
	        "type": "instant" | "next-day",
	        "accountId": string,
	    } | null,
	    "mobileMoneyDetails": {
	        "country": string,
	        "phone": string,
	        "operator": string,
	        "accountName": string | null,
	        "operatorTransactionId": string | null,
	    } | null,
	    "bankAccountDetails": null,
	    "cardDetails": {
	        "firstName": string | null,
	        "lastName": string | null,
	        "bin": string | null,
	        "last4": string | null,
	        "cardType": string | null,
	    } | null,
	}
}
```

Language

ShellNodeRubyPHPPython

Credentials

Header

Header

[Log in to use your API keys](https://lenco-api.readme.io/login?redirect_uri=/v2.0/reference/get-collection-by-reference)