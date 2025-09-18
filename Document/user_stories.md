# Essential Features

## 1. Register
**a. Front** - As a user, I need to Register so that I can save my content.  

**b. Back** -  
   i. Users can register with required details (username, email, password).  
   ii. Passwords must meet minimum security requirements.  
   iii. Duplicate emails are not allowed.  
   iv. Data is stored securely (passwords are encrypted).  
   v. User redirects to the Login Page.  

---

## 2. Login
**a. Front** - As a user, I need to Login so that I can access my saved content on different devices or on reloading.  

**b. Back** -  
   i. Users can log in with valid credentials (Username, Email and Password must match in database).  
   ii. Invalid credentials show a clear error message.  
   iii. Session remains active until logout or timeout.  
   iv. Successful login redirects to dashboard/home page.  

---

## 3. Create New Story
**a. Front** - As a user, I want to Create a New Story so that I can access my saved content on different devices or on reloading.  

**b. Back** -  
   i. The user is redirected to the Story Form to provide details to be filled in that entry.  

---

## 4. Logout
**a. Front** - As a user, I want to be able to Logout so that I can login from other accounts or prevent someone else from accessing without logging in.  

**b. Back** -  
   i. Session is terminated on logout.  
   ii. The user is redirected to the Login Page.  
   iii. Prevents access to stories until re-login.

---

## 5. Story Form
**a. Front** - As a user, I want to be able to fill in information about my story so that I can know what kind of story I am generating and interacting with.  

**b. Back** -  
   i. The form accepts details such as title, setting and characters.  
   ii. Data is validated and saved in the database.  
   iii. User is redirected to the Story Generation Page after saving.  

---

## 6. Story Generation Page
**a. Front** - As a user, I want to generate my story using prompts, so that I can continue a particular story.  

**b. Back** -  
   i. Users can input prompts to progress the story.  
   ii. The system generates story content based on the prompt.  
   iii. New story content is saved and linked with the existing story session.  
   iv. Page dynamically updates with the latest prompt and response.  

---

## 7. View Previous Stories
**a. Front** - As a user, I want to generate my story using prompts, so that I can continue a particular story.  

**b. Back** -  
   i. Users can access a list of previously saved stories linked to their account.  
   ii. Each story can be reopened to resume from the last saved prompt.  
   iii. Stories can be sorted by creation date, last edited, or title.  

---

## 8. Exit from Story Generation Page
**a. Front** - As a user, I want to go back to the home page, so that I can continue making or viewing other stories.  

**b. Back** -  
   i. Exiting saves the current story state automatically.  
   ii. The user is redirected back to the dashboard/home page.  
   iii. There is no data loss when leaving story generation.  

---
