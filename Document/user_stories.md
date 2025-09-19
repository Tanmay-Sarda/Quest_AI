# Essential Features

## 1. Register
**a. Front** - As a logged out user, I need to Register so that I can save my content.  

**b. Back** -  
   i. Users can register with required details (username, email, password).  
   ii. Passwords must meet minimum security requirements.  
   iii. Duplicate emails are not allowed.  
   iv. Data is stored securely (passwords are encrypted).  
   v. User redirects to the Login Page.  

---

## 2. Login
**a. Front** - As a logged out user, I need to Login so that I can access my saved content on different devices or on reloading.  

**b. Back** -  
   i. Users can log in with valid credentials (Username, Email and Password must match in database).  
   ii. Invalid credentials show a clear error message.  
   iii. Session remains active until logout or timeout.  
   iv. Successful login redirects to dashboard/home page.  

---

## 3. Create New Story
**a. Front** - As a logged in user, I want to Create a New Story so that I can access my saved content on different devices or on reloading.  

**b. Back** - 
   i. The user must be logged in.
   ii. The user must be on the home page.
   iii. The user is redirected to the Story Form to provide details to be filled in that entry.  

---

## 4. Logout
**a. Front** - As a logged in user, I want to be able to Logout so that I can login from other accounts or prevent someone else from accessing without logging in.  

**b. Back** - 
   i. The user must be logged in. 
   ii. Session is terminated on logout.  
   iii. The user is redirected to the Login Page.  
   iv. Prevents access to stories until re-login.

---

## 5. Story Form
**a. Front** - As a logged in user, I want to be able to fill in information about my story so that I can know what kind of story I am generating and interacting with.  

**b. Back** -  
   i. The user must be logged in.
   ii. The form accepts details such as title, setting and characters.  
   iii. Data is validated and saved in the database.  
   iv. User is redirected to the Story Generation Page after saving.  

---

## 6. Story Generation Page
**a. Front** - As a logged in user, I want to generate my story using prompts, so that I can continue a particular story.  

**b. Back** -
   i. The user must be logged in.
   ii. The user must be on the Story Generation page.
   iii. Users can input prompts to progress the story.  
   iv. The system generates story content based on the prompt.  
   v. New story content is saved and linked with the existing story session.  
   vi. Page dynamically updates with the latest prompt and response.  

---

## 7. View Previous Stories
**a. Front** - As a logged in user, I want to generate my story using prompts, so that I can continue a particular story.  

**b. Back** -  
   i. The user must be logged in.
   ii. The user must be on the home page. 
   iii. Users can access a list of previously saved stories linked to their account.  
   iv. Each story can be reopened to resume from the last saved prompt.  
   v. Stories can be sorted by creation date, last edited, or title. 

---

## 8. Exit from Story Generation Page
**a. Front** - As a logged in user, I want to go back to the home page, so that I can continue making or viewing other stories.  

**b. Back** -  
   i. The user must be logged in.
   ii. The user must be on the story generation page.
   iii. Exiting saves the current story state automatically.  
   iv. The user is redirected back to the dashboard/home page.  
   v. There is no data loss when leaving story generation.  

---

## 9. About Us Page
**a. Description** - As a logged-out user/ logged in user, I want to view an About Us page so that I can learn about the app before signing up.  

**b. Acceptance Criteria** -  
   i. About Us page is accessible without login.  
   ii. The page provides information about the interactive storytelling app, its purpose, and future features.  
   iii. Page is visible on the navigation bar for all users (logged in and logged out).  
