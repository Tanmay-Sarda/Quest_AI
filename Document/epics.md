# EPICs

## 1. User Authentication & Account Management
**a. Description** - As a user, I need secure account management so that I can register, login, and logout safely.  

**b. Covers User Stories** - 1 (Register), 2 (Login), 4 (Logout)  

**c. Acceptance Criteria** -  
   i. Users can register with valid details (username, email, password).  
   ii. Passwords must meet security requirements and be encrypted.  
   iii. Users can log in with correct credentials and receive clear errors for invalid attempts.  
   iv. Sessions remain active until logout or timeout.  
   v. Logout terminates the session and redirects to login.  
   vi. No access to protected features without login.  

---

## 2. Story Creation & Setup
**a. Description** - As a user, I want to create and set up new stories so that I can start interactive storytelling.  

**b. Covers User Stories** - 3 (Create New Story), 5 (Story Form)  

**c. Acceptance Criteria** -  
   i. Users can create a new story entry.  
   ii. A story form is provided to capture title, setting, and characters.  
   iii. Data from the story form is validated and stored in the database.  
   iv. Users are redirected to the Story Generation Page after creating a story.  

---

## 3. Interactive Story Generation
**a. Description** - As a user, I want to interactively generate stories using prompts so that I can progress in my chosen narrative.  

**b. Covers User Stories** - 6 (Story Generation Page), 8 (Exit from Story Generation Page)  

**c. Acceptance Criteria** -  
   i. Users can input prompts to generate story continuation.  
   ii. The system generates responses based on user input.  
   iii. Story progress is automatically saved and linked to the session.  
   iv. The page dynamically updates with the latest prompt and response.  
   v. Exiting the story saves progress automatically.  
   vi. Users are redirected back to the home/dashboard without data loss.  

---

## 4. Story Management & Retrieval
**a. Description** - As a user, I want to view and manage my previously created stories so that I can continue or organize them.  

**b. Covers User Stories** - 7 (View Previous Stories)  

**c. Acceptance Criteria** -  
   i. Users can view a list of their saved stories.  
   ii. Stories can be reopened and resumed from the last saved point.  
   iii. Stories can be sorted and filtered by title, date created, or last edited.  

---

## 5. About Us Page
**a. Description** - As a visitor (logged-out user), I want to view an About Us page so that I can learn about the app before signing up.  

**b. Covers User Stories** - 9 (## 9. About Us Page)

**c. Acceptance Criteria** -  
   i. About Us page is accessible without login.  
   ii. The page provides information about the interactive storytelling app, its purpose, and future features.  
   iii. Page is visible on the navigation bar for all users (logged in and logged out).  
