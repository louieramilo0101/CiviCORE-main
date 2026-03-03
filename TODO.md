# Bug Fixes TODO List

## Bug 1: Role updates but permissions not refreshed → UI incomplete
- [ ] Fix performEditAccount() in accounts.js to fetch full user after update

## Bug 2: Old session UI persists until refresh
- [ ] Create initializeAppUI() function in accounts.js
- [ ] Call initializeAppUI() in loginUser() in auth.js
- [ ] Call initializeAppUI() in performEditAccount() after updating own account

## Consistency Fix
- [ ] Make permission checks consistent with null checks everywhere
