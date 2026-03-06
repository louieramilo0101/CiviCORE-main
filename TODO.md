# Implementation TODO

## Current Tasks from User Request

### 1. Checkbox in Issuance Section - FIX
- [ ] Fix checkbox toggle functionality in issuance table
- [ ] Ensure selectAllCheckbox works properly
- [ ] Add visual feedback for checkbox state
- [ ] Test toggle button functionality

### 2. EasyOCR Running - Loading Button & Display
- [ ] Add loading spinner/indicator when EasyOCR is processing
- [ ] Show extracted text in a document area for accuracy review
- [ ] Add "Paste to Form" button to transfer OCR text to form fields
- [ ] Display confidence score and words found

### 3. Input Validation in Upload Section
- [ ] Add file type validation (only PDF, JPG, PNG allowed)
- [ ] Add file size validation (max 10MB)
- [ ] Add document type selection validation (must select birth/death/marriage)
- [ ] Show clear error messages for validation failures

### 4. EasyOCR Text Capture & Document Display
- [ ] Add extracted text preview area in upload page
- [ ] Create editable text area to review/edit OCR results
- [ ] Add "Use This Text" button to populate form fields
- [ ] Add copy to clipboard functionality

### 5. Save Files to Database (Not User Device)
- [ ] Modify database schema to store files as BLOB
- [ ] Update server.js to handle BLOB storage
- [ ] Update upload API to store file data in database
- [ ] Update document retrieval to fetch from database
- [ ] Add file download functionality from database

---

## Major TODO List (Long-term)

### 6. Transfer to React - No Page Loading
- [ ] Convert existing vanilla JS to React components
- [ ] Implement React Router for navigation
- [ ] Use React state management for data
- [ ] Implement Server-Side Rendering (SSR) for initial load
- [ ] Add React loading states and transitions

### 7. Secure Login - Hide Password/Account Details
- [ ] Implement JWT (JSON Web Tokens) for authentication
- [ ] Store tokens securely (httpOnly cookies)
- [ ] Hash passwords with bcrypt on server
- [ ] Implement proper session management
- [ ] Add CSRF protection
- [ ] Ensure sensitive data is never sent to client
- [ ] Implement logout functionality that clears tokens

---

## Completed Tasks
- [x] Update HTML - Add toggle button and Delete Selected button
- [x] Update JavaScript - Add toggle and delete functions
- [x] Update CSS - Add styling for new elements

