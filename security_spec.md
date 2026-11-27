# Security Specification — Souvenir Business Hub

## 1. Data Invariants
1. **Two-Owner Admin Access**: Only two explicitly authorized verified Google owner accounts (bootstrapped primary owner `david.qc.op@gmail.com` plus optional secondary owner configured in `business_settings/operations`) can read or mutate private operational collections (`customers`, `suppliers`, `supplier_products`, `quotations`, `sales_orders`, `purchase_orders`, `customer_payments`, `supplier_payments`, `expenses`, `inspections`, `deliveries`, `activity_logs`, `business_settings/operations`).
2. **Public Catalog Isolation**: Public visitors can read only `products` where `isPublished == true`, `catalog_categories` where `isActive == true`, and `business_settings/storefront`. Supplier purchase costs, profit margins, and draft products are strictly separated and inaccessible to public visitors.
3. **Inquiry Blind-Create Privacy**: Public visitors can submit validated inquiries (`status == 'NEW'`) and inquiry items (`inquiryId` verified to exist via `exists()` / `existsAfter()`), but public visitors CANNOT `get` or `list` any `inquiries` or `inquiry_items` so other customers' contact details are never exposed.
4. **Immutable Audit & Creation Timestamps**: All writes enforce `createdAt == request.time` on creation, `createdAt == existing().createdAt` on update, and `updatedAt == request.time` on update.
5. **Email Verification Gate**: All authenticated admin access strictly requires `request.auth.token.email_verified == true`.

## 2. "Dirty Dozen" Adversarial Payloads
1. **Unverified Admin Email Spoof**: Signed-in token with `email: "david.qc.op@gmail.com"` and `email_verified: false` attempting to read `/customers` -> `PERMISSION_DENIED`.
2. **Unauthorized Third-Party Google Account**: Verified signed-in user `attacker@gmail.com` attempting to list `/suppliers` or `/inquiries` -> `PERMISSION_DENIED`.
3. **Self-Assigned Owner Role**: Verified non-owner user attempting `create` on `/users/{uid}` with `role: "owner"` -> `PERMISSION_DENIED`.
4. **Draft Product Scrape**: Public unauthenticated visitor attempting `get` or `list` on `/products` where `isPublished == false` -> `PERMISSION_DENIED`.
5. **Supplier Cost Leakage**: Public visitor attempting `get` or `list` on `/supplier_products` or `/suppliers` -> `PERMISSION_DENIED`.
6. **Inquiry Status Tampering on Create**: Public visitor submitting `/inquiries/{id}` with `status: "APPROVED"` instead of `"NEW"` -> `PERMISSION_DENIED`.
7. **Shadow Ghost Field Injection**: Public visitor submitting `/inquiries/{id}` with extra field `internalDiscount: 500000` -> `PERMISSION_DENIED` (blocked by `keys().hasOnly(...)`).
8. **Other Customer Inquiry Scrape**: Public visitor attempting `get` or `list` on `/inquiries` -> `PERMISSION_DENIED`.
9. **Path ID Poisoning**: Request targeting `/products/` with oversized (>128 chars) or special-character document ID -> `PERMISSION_DENIED` (blocked by `isValidId()`).
10. **Operations Settings Public Read**: Unauthenticated visitor attempting `get` on `/business_settings/operations` -> `PERMISSION_DENIED`.
11. **Timestamp Forgery**: Authenticated admin or public user attempting to set `createdAt` to a past timestamp instead of `request.time` -> `PERMISSION_DENIED`.
12. **Orphaned Inquiry Item**: Public visitor creating `/inquiry_items/{id}` pointing to a non-existent `inquiryId` -> `PERMISSION_DENIED` (blocked by `exists` / `existsAfter` gate).
