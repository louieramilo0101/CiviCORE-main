# Migration from LocalStorage to MySQL

## Task: Remove database.js and migrate to MySQL (civicore_db)

### TODO List:
- [ ] 1. Create SQL statements for new tables (documents, issuances, templates)
- [ ] 2. Update server.js with all API endpoints
- [ ] 3. Update script.js - remove MockDatabase class and use fetch() instead
- [ ] 4. Update documents.js - replace db.* calls with API calls
- [ ] 5. Update issuance.js - replace db.* calls with API calls
- [ ] 6. Update accounts.js - replace db.* calls with API calls
- [ ] 7. Update maps.js - replace db.* calls with API calls
- [ ] 8. Finally delete database.js
