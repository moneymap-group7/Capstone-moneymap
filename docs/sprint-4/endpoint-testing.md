Backend Endpoint Testing – Summary
Environment

Localhost:3000
Tool: Thunder Client
Auth: JWT Bearer Token

Health Endpoints
GET /health → 200 OK
GET /health/db → 200 OK (DB connected)
API and database are working correctly.

Authentication
POST /auth/login → 200 OK (accessToken returned)
Protected routes without token → 401 Unauthorized
Authorization and route protection verified.

Transactions
GET /transactions → pagination working
PATCH /transactions/:id/category
Invalid body → 400 Bad Request
Valid body → 200 OK (transaction updated)
Dynamic update confirmed: aggregation updates immediately after category change.

Analytics
Tested:
/analytics/aggregation
/analytics/summary
/analytics/by-category
/analytics/monthly
All returned 200 OK with correct calculations.
Unauthorized access correctly returned 401.

Budgets
Tested:
/budgets/utilization
/budgets/utilization/compare
/budgets/utilization/mock
Validation working (400 for missing query params)
Calculations working correctly

Security Finding
The following endpoints are not protected by JWT guard:
/budgets/utilization
/budgets/utilization/compare
/budgets/utilization/mock
All analytics endpoints are properly protected.
This indicates an integration issue:
Budgets/Utilization controller is missing JWT guard.

Overall Result
Backend endpoints were tested for:
Functionality
Validation
Authorization
Error handling
Aggregation accuracy
Budget recalculation
Dynamic update consistency
Core logic is stable. One security integration issue identified and will be fixed in next Task