---
url: "https://lenco-api.readme.io/v2.0/reference/encryption"
title: "Encryption"
---

[Jump to Content](https://lenco-api.readme.io/v2.0/reference/encryption#content)

[![Lenco API](https://files.readme.io/cf066d0-small-512.jpg)](https://lenco.co/)

[API Reference](https://lenco-api.readme.io/v2.0/reference) v1.0v2.0

* * *

[Log In](https://lenco-api.readme.io/login?redirect_uri=/reference/encryption) [![Lenco API](https://files.readme.io/cf066d0-small-512.jpg)](https://lenco.co/)

API Reference

[Log In](https://lenco-api.readme.io/login?redirect_uri=/v2.0/reference/encryption)

v2.0

API Reference

Encryption

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

1. Lenco API

# Encryption

Ask AI

The transport between client applications and Lenco is secured using TLS/SSL, which means data is encrypted by default when transmitted across networks.

In addition, certain endpoints of the Lenco API make use of JSON Web Encryption (JWE) to provide end-to-end payload encryption to secure sensitive data. For instance, the [Card Collection API](https://lenco-api.readme.io/v2.0/reference/initiate-collection-from-card) must comply with the Payment Card Industry Data Security Standard in dealing with cardholder Personally Identifying Information (PII).

JSON Web Encryption (JWE) represents encrypted content using JSON-based data structures and base64url encoding. Lenco uses JWE compact serialization for the encryption of sensitive data.

Lenco encryption uses AES in GCM (Galois/Counter Mode) mode with PKCS#7 padding and RSA with OAEP (Optimal Asymmetric Encryption Padding).

### The Encryption Keys   [Skip link to The Encryption Keys](https://lenco-api.readme.io/v2.0/reference/encryption\#the-encryption-keys)

**RSA**

Encryption involves a 2048-bit RSA public/private key pair. Data encrypted using a public key can only be decrypted using the corresponding private key.

The client application will get an RSA public key using the [Get Encryption Key](https://lenco-api.readme.io/v2.0/reference/get-encryption-key) endpoint, which allows to encrypt the request payload.

**AES**

For performance reasons, RSA asymmetric encryption is combined with AES symmetric encryption. For that, a one-time usage 256-bit AES session key is generated and encrypted using the RSA public key. The encrypted (or wrapped) key is sent in the payload along with the encrypted data.

### The Encryption Process   [Skip link to The Encryption Process](https://lenco-api.readme.io/v2.0/reference/encryption\#the-encryption-process)

Here are the steps for sending an encrypted payload:

1. An AES session key is generated along with some encryption parameters
2. Sensitive data are encrypted using the AES key
3. The AES key is encrypted using the RSA public key gotten from the [Get Encryption Key](https://lenco-api.readme.io/v2.0/reference/get-encryption-key) endpoint
4. The payload is sent with the encrypted session key and parameters

### How to Encrypt Payload   [Skip link to How to Encrypt Payload](https://lenco-api.readme.io/v2.0/reference/encryption\#how-to-encrypt-payload)

The encrypted payload is structured in JSON Web Encryption (JWE) format, the plain text JSON body is encrypted to form a JWE encrypted payload that is sent as the request body (replacing the plain text data).

**Step 1**: Construct the original JSON per the API specification.

**Step 2**: Get the RSA public key using from the [Get Encryption Key](https://lenco-api.readme.io/v2.0/reference/get-encryption-key) endpoint. Beware that this key might change anytime and therefore should not be stored and reused.

**Step 3**: Use JWE to encrypt the original request in compact serialized form using the below JOSE headers:

| JOSE Header | Value | Description |
| --- | --- | --- |
| enc | A256GCM | encryption algorithm |
| alg | RSA-OAEP-256 | Key encryption algorithm |
| cty | application/json | content type of the encrypted payload |
| kid | `kid` property of the RSA public key (JWK) | Public Fingerprint ID which is used to identify the private key needed to decrypt the message |

**Step 4**: Construct request payload as shown below:

JSON

```json
{
	"encryptedPayload": "JWE encrypted payload"
}
```

Examples:

GoNode

```go
package main

import (
	"github.com/lestrrat-go/jwx/jwa"
	"github.com/lestrrat-go/jwx/jwe"
	"github.com/lestrrat-go/jwx/jwk"
)

func encrypt(payload []byte) (string, error) {
	jwkJSON := `{
		"kty": "RSA",
		"use": "enc",
		"n": "nApb8LyyFrZw4A(...)W1RpGR6Z7zcNikiZcQ",
		"e": "AQAB",
		"kid": "2bbb0d(...)2f68aa"
	}`

	rsaPublicKey, err := jwk.ParseKey([]byte(jwkJSON))
	if err != nil {
		return "", err
	}

	encrypted, err := jwe.Encrypt(payload, jwa.RSA_OAEP_256, rsaPublicKey, jwa.A256GCM, jwa.NoCompress)
	if err != nil {
		return "", err
	}

	return string(encrypted[:]), nil
}
```

```javascript
const jose = require("jose");

async function encrypt(payload) {
    const jwkData = {
        "kty": "RSA",
        "use": "enc",
        "n": "nApb8LyyFrZw4A(...)W1RpGR6Z7zcNikiZcQ",
        "e": "AQAB",
        "kid": "2bbb0d(...)2f68aa"
    };

    const rsaPublicKey = await jose.importJWK(jwkData);
    const text = JSON.stringify(payload);
    const jwe = await new jose.CompactEncrypt(new TextEncoder().encode(text))
        .setProtectedHeader({
            alg: 'RSA-OAEP-256',
            enc: 'A256GCM',
            cty: 'application/json',
            kid: jwkData.kid
        })
        .encrypt(rsaPublicKey);

    return jwe;
}
```

> ## 🚧  NB
>
> The examples above are just code samples to help get you started. Lenco does not in any way recommend the use of these libraries.
>
> It is important that you scrutinise / audit any third party library or package before using it in production.

Updated over 1 year ago

* * *

[Webhooks](https://lenco-api.readme.io/v2.0/reference/webhooks) [/encryption-key](https://lenco-api.readme.io/v2.0/reference/get-encryption-key)

Updated over 1 year ago

* * *

[Webhooks](https://lenco-api.readme.io/v2.0/reference/webhooks) [/encryption-key](https://lenco-api.readme.io/v2.0/reference/get-encryption-key)

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