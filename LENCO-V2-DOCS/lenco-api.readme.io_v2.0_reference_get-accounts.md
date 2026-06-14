---
url: "https://lenco-api.readme.io/v2.0/reference/get-accounts"
title: "/accounts"
---

[Jump to Content](https://lenco-api.readme.io/v2.0/reference/get-accounts#content)

[![Lenco API](https://files.readme.io/cf066d0-small-512.jpg)](https://lenco.co/)

[API Reference](https://lenco-api.readme.io/v2.0/reference) v1.0v2.0

* * *

[Log In](https://lenco-api.readme.io/login?redirect_uri=/reference/get-accounts) [![Lenco API](https://files.readme.io/cf066d0-small-512.jpg)](https://lenco.co/)

API Reference

[Log In](https://lenco-api.readme.io/login?redirect_uri=/v2.0/reference/get-accounts)

v2.0

API Reference

/accounts

Search
`CTRL-K`

All

Reference

###### Start typing to search…

JUMP TO `CTRL-/`

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

# /accounts

Ask AI

get

https://api.lenco.co/access/v2/accounts

Retrieve information about your bank accounts

Response schema:

JSON

```json
{
    "status": boolean,
    "message": string,
    "data": [\
    	{\
		    "id": string,\
		    "details": {\
		        "type": string,\
		        "accountName": string,\
		        "tillNumber": string\
		    },\
        "type": string,\
        "status": string,\
        "createdAt": date-time,\
		    "currency": string,\
		    "availableBalance": string | null,\
		    "ledgerBalance": string | null\
      }\
    ],
    "meta": {
        "total": number,
        "pageCount": number,
        "perPage": number,
        "currentPage": number
    }
}
```

> ## 📘  date-time
>
> All date-time fields are expressed in ISO8601 UTC times.

[Skip link to Query Params](https://lenco-api.readme.io/v2.0/reference/get-accounts#query-params) Query Params

page

int32

Defaults to 1

If not specified, it defaults to 1

[Skip link to Response](https://lenco-api.readme.io/v2.0/reference/get-accounts#response-schemas) Response

# `` 200      200

Updated almost 2 years ago

* * *

[Test Cards and Accounts](https://lenco-api.readme.io/v2.0/reference/test-cards-and-accounts) [/accounts/:id](https://lenco-api.readme.io/v2.0/reference/get-account-by-id)

Language

ShellNodeRubyPHPPython

Credentials

Header

Header

[Log in to use your API keys](https://lenco-api.readme.io/login?redirect_uri=/v2.0/reference/get-accounts)

cURL Request

```

xxxxxxxxxx

curl --request GET \

     --url https://api.lenco.co/access/v2/accounts \

     --header 'Authorization: Bearer xo+CAiijrIy9XvZCYyhjrv0fpSAL6CfU8CgA+up1NXqK' \

     --header 'accept: application/json'
```

Response

Choose an example:

application/json

``200 - Result

Updated almost 2 years ago

* * *

[Test Cards and Accounts](https://lenco-api.readme.io/v2.0/reference/test-cards-and-accounts) [/accounts/:id](https://lenco-api.readme.io/v2.0/reference/get-account-by-id)

01. Lenco API
02. [Welcome to Lenco's API doc](https://lenco-api.readme.io/v2.0/reference/introduction)
03. [Getting Started](https://lenco-api.readme.io/v2.0/reference/get-started)
04. [Accept Payments](https://lenco-api.readme.io/v2.0/reference/accept-payments)
05. [Test Cards and Accounts](https://lenco-api.readme.io/v2.0/reference/test-cards-and-accounts)
06. [Accounts](https://lenco-api.readme.io/v2.0/reference/accounts)
07. [/accounts/:id/balanceget](https://lenco-api.readme.io/v2.0/reference/get-account-balance)
08. [/accounts/:idget](https://lenco-api.readme.io/v2.0/reference/get-account-by-id)
09. [/accountsget](https://lenco-api.readme.io/v2.0/reference/get-accounts)
10. [Banks](https://lenco-api.readme.io/v2.0/reference/banks)
11. [/banksget](https://lenco-api.readme.io/v2.0/reference/get-banks)
12. [Resolve Account](https://lenco-api.readme.io/v2.0/reference/resolve-account)
13. [/resolve/lenco-merchantpost](https://lenco-api.readme.io/v2.0/reference/resolve-lenco-merchant-account)
14. [/resolve/lenco-moneypost](https://lenco-api.readme.io/v2.0/reference/resolve-lenco-money-account)
15. [/resolve/mobile-moneypost](https://lenco-api.readme.io/v2.0/reference/resolve-mobile-money-account)
16. [/resolve/bank-accountpost](https://lenco-api.readme.io/v2.0/reference/resolve-bank-account)
17. [Transfer Recipients](https://lenco-api.readme.io/v2.0/reference/transfer-recipients)
18. [/transfer-recipients/lenco-merchantpost](https://lenco-api.readme.io/v2.0/reference/create-transfer-recipient-as-lenco-merchant)
19. [/transfer-recipients/lenco-moneypost](https://lenco-api.readme.io/v2.0/reference/create-transfer-recipient-as-lenco-money)
20. [/transfer-recipients/mobile-moneypost](https://lenco-api.readme.io/v2.0/reference/create-transfer-recipient-as-mobile-money)
21. [/transfer-recipients/bank-accountpost](https://lenco-api.readme.io/v2.0/reference/create-transfer-recipient-as-bank-account)
22. [/transfer-recipients/:idget](https://lenco-api.readme.io/v2.0/reference/get-transfer-recipient-by-id)
23. [/transfer-recipientsget](https://lenco-api.readme.io/v2.0/reference/get-transfer-recipients)
24. [Transfers](https://lenco-api.readme.io/v2.0/reference/transfers)
25. [/transfers/accountpost](https://lenco-api.readme.io/v2.0/reference/initiate-transfer-to-account)
26. [/transfers/lenco-merchantpost](https://lenco-api.readme.io/v2.0/reference/initiate-transfer-to-lenco-merchant)
27. [/transfers/lenco-moneypost](https://lenco-api.readme.io/v2.0/reference/initiate-transfer-to-lenco-money)
28. [/transfers/mobile-moneypost](https://lenco-api.readme.io/v2.0/reference/initiate-transfer-to-mobile-money)
29. [/transfers/bank-accountpost](https://lenco-api.readme.io/v2.0/reference/initiate-transfer-to-bank-account)
30. [/transfers/status/:referenceget](https://lenco-api.readme.io/v2.0/reference/get-transfer-by-reference)
31. [/transfers/:idget](https://lenco-api.readme.io/v2.0/reference/get-transfer-by-id)
32. [/transfersget](https://lenco-api.readme.io/v2.0/reference/get-transfers)
33. [Collections](https://lenco-api.readme.io/v2.0/reference/collections)
34. [/collections/cardpost](https://lenco-api.readme.io/v2.0/reference/initiate-collection-from-card)
35. [/collections/mobile-moneypost](https://lenco-api.readme.io/v2.0/reference/initiate-collection-from-mobile-money)
36. [/collections/status/:referenceget](https://lenco-api.readme.io/v2.0/reference/get-collection-by-reference)
37. [/collections/:idget](https://lenco-api.readme.io/v2.0/reference/get-collection-by-id)
38. [/collectionsget](https://lenco-api.readme.io/v2.0/reference/get-collections)
39. [Settlements](https://lenco-api.readme.io/v2.0/reference/settlements)
40. [/settlements/:idget](https://lenco-api.readme.io/v2.0/reference/get-settlement-by-id)
41. [/settlementsget](https://lenco-api.readme.io/v2.0/reference/get-settlements)
42. [Transactions](https://lenco-api.readme.io/v2.0/reference/transactions)
43. [/transactions/:idget](https://lenco-api.readme.io/v2.0/reference/get-transaction-by-id)
44. [/transactionsget](https://lenco-api.readme.io/v2.0/reference/get-transactions)
45. [Webhooks](https://lenco-api.readme.io/v2.0/reference/webhooks)
46. [Encryption](https://lenco-api.readme.io/v2.0/reference/encryption)
47. [/encryption-keyget](https://lenco-api.readme.io/v2.0/reference/get-encryption-key)