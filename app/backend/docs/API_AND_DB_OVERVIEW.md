# Backend API and Database Overview

This document provides an overview of the backend API endpoints and the corresponding database entities.

## Authentication (`/api/v1/auth`)

Handles user authentication and session management.

### API Endpoints

-   `POST /login-by-verifier`: Logs in a user based on a transaction ID from the verifier service. Returns an `accessToken`.
-   `POST /refresh`: Refreshes an expired `accessToken` using a `refreshToken` stored in a cookie.
-   `POST /logout`: Logs out the user and clears the session cookie.
-   `GET /me`: Retrieves the profile of the currently authenticated user.

### Associated Entities

#### `users` (`UserEntity`)

Stores user information.

-   `id`: (UUID) Primary key.
-   `name`: (String) User's name.
-   `role`: ('user' | 'platform') User's role.
-   `idNumber`: (String) User's national ID number (unique).
-   `birthday`: (String) User's birthday.
-   `address`: (String) User's address.
-   `score`: (Number) User's rating score.
-   `ratingSum`: (Int) Sum of all ratings.
-   `ratingCount`: (Int) Total number of ratings.
-   `createdAt`, `updatedAt`: Timestamps.

---

## Trade Forms (`/api/v1/tradeforms`)

Manages the creation and lifecycle of trade forms, which are the central object for a trade.

### API Endpoints

-   `POST /`: Creates a new trade form.
-   `GET /uid/{uid}`: Retrieves a specific trade form by its public `uid`.
-   `PUT /{uid}`: Updates a trade form using its public identifier.
-   `DELETE /{id}`: Deletes a trade form.
-   `POST /{uid}/confirm`: Confirms a trade from the perspective of the current user.

### Associated Entities

#### `trade_forms` (`TradeFormEntity`)

Represents a trade agreement between two users.

-   `id`: (Int) Primary key.
-   `uid`: (String) Publicly visible unique identifier.
-   `creatorId`: (String) The `idNumber` of the user who created the form.
-   `counterpartyId`: (String) The `idNumber` of the other user in the trade.
-   `itemName`, `itemDescription`, `itemCondition`: Details about the item being traded.
-   `amount`: (String) The trade amount.
-   `tradeChannel`, `paymentMethod`, `matchmakingChannel`: Enums describing the trade logistics.
-   `identityRequirements`: (Array of Enums) Specifies what kind of identity verification is needed.
-   `status`: (Enum) The current status of the trade (e.g., `PENDING`, `CONFIRMED`, `FINALIZED`).
-   `confirmedByUser1`, `confirmedByUser2`: Booleans to track confirmation from both parties.
-   `meta`: (JSONB) Stores additional metadata, like VC verification results.
-   ... and other timestamp and status fields.

#### `trade_audit_events` (`TradeAuditEventEntity`)

Logs significant actions taken on a trade form.

-   `tradeUid`: The `uid` of the related trade form.
-   `actorId`: The ID of the user who performed the action.
-   `action`: (Enum) The type of action (e.g., `CREATE`, `CONFIRM`, `VERIFY_VC`).
-   `details`: (JSONB) Additional details about the event.

#### `idempotency_keys` (`IdempotencyKeyEntity`)

Used to prevent duplicate requests for critical operations.

-   `key`: The idempotency key string.
-   `route`: The API route being called.
-   `actorId`: The user performing the action.
-   `statusCode`, `responseBody`: The response that was originally sent.

---

## Trades (`/api/v1/trades`)

Handles fetching trade history and rating trades.

### API Endpoints

-   `GET /`: Gets a list of trades for the currently authenticated user.
-   `GET /{uid}`: Gets the detailed view of a single trade.
-   `POST /{uid}/rating`: Submits a rating (1-5 stars) for a completed trade.

### Associated Entities

#### `trade_ratings` (`TradeRatingEntity`)

Stores ratings given by users to each other after a trade.

-   `tradeUid`: The `uid` of the trade being rated.
-   `fromIdNumber`: The `idNumber` of the user giving the rating.
-   `toIdNumber`: The `idNumber` of the user being rated.
-   `stars`: (Int) The rating value from 1 to 5.

---

## Verifier (`/api/v1/verifier`)

Manages the process of verifying user identity via QR codes. This is likely an external or internal service that the login process depends on.

### API Endpoints

-   `POST /qrcode`: Creates a verification QR code.
-   `POST /result`: Polls for the result of a verification transaction.
-   `GET /id-card/qrcode`: A specific endpoint to generate a QR code for ID card verification.

### Associated Entities

#### `verification_tx` (`VerificationTx`)

Represents a single verification transaction.

-   `transactionId`: (String) The unique ID for this verification flow.
-   `kind`: (String) The type of verification.
-   `status`: ('pending' | 'success' | 'failed') The status of the verification.
-   `resultJson`: (JSONB) The claims or data received upon successful verification.

---

## Issuer (`/api/v1/issuer`)

Handles the issuance of Verifiable Credentials.

### API Endpoints

-   `POST /qrcode-data`, `POST /qrcode-nodata`: Endpoints to generate QR codes for credential issuance.
-   `GET /credential/nonce/{transactionId}`: Gets a nonce required for the credential issuance process.

### Associated Entities

#### `issued_credential` (`IssuedCredential`)

Stores credentials that have been issued.

-   `transactionId`: (String) The unique ID for the issuance transaction.
-   `credentialJwt`: (String) The issued credential in JWT format.
-   `cid`: (String) Credential ID, likely for revocation purposes.
-   `meta`: (JSONB) Additional metadata.
