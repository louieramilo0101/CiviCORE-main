# Migration from LocalStorage to MySQL

## Task: Remove database.js and migrate to MySQL (civicore_db)

### TODO List:
- [x] 1. Create SQL statements for new tables (documents, issuances, templates)
- [x] 2. Update server.js with all API endpoints
- [x] 3. Update script.js - remove MockDatabase class and use fetch() instead
- [x] 4. Update documents.js - uses db object from script.js
- [x] 5. Update issuance.js - uses db object from script.js
- [x] 6. Update accounts.js - uses db object from script.js
- [x] 7. Update maps.js - uses db object from script.js
- [x] 8. Delete database.js

## Status: COMPLETE

### Files Created/Modified:
- database_tables.sql - SQL for new MySQL tables
- server.js - Added API endpoints
- api.js - Created async API functions
- script.js - Added data cache and db wrapper
- index.html - Updated script loading order

### Next Steps:
1. Run database_tables.sql in HeidiSQL to create tables
2. Restart Node.js server
3. Test the application
=======
