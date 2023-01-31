# Lottallamas API

## Objective

To make an API that uses wallet signatures and tokens contained within a wallet to manage permissions and content exposure.

## User Flow
### Login
1. User is presented with a randomized string and inputs for wallet address and hash.
2. User signs random string in wallet(freewallet).
3. User inputs wallet address and signed hash.
4. Signature, wallet address, and message are sent to `/validate-wallet` endpoint.  Endpoint verifies ownership of wallet address, calls xchain.io(for getting wallet contents), and creates a JWT containg wallet address and its contents.  This JWT will live client side.

### Auth
1. User requests content from endpoint and submits the JWT along with the request.
2. The token is decoded(presenting existing array of tokens contained in that wallet).
3. The token found on the content model(`accessToken`) is compared to wallet contaminates
4. Assuming access token is a match with a token contained in the wallet, display content/post/comments, etc.

### Developers Notes
* Developed on Node v16.13.0
* To be used in conjunction with models repo