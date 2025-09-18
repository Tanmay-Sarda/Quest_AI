# Essential Features

## 1. Register
*a. Front* - As a user, I need to Register so that I can save my content.  

*b. Back* -  
   i. Users can register with required details (username, email, password).  
   ii. Passwords must meet minimum security requirements.  
   iii. Duplicate emails are not allowed.  
   iv. Data is stored securely (passwords are encrypted).  
   v. User redirects to the Login Page.  

---

## 2. Login
*a. Front* - As a user, I need to Login so that I can access my saved content on different devices or on reloading.  

*b. Back* -  
   i. Users can log in with valid credentials (Username, Email and Password must match in database).  
   ii. Invalid credentials show a clear error message.  
   iii. Session remains active until logout or timeout.  
   iv. Successful login redirects to dashboard/home page.  

---

## 3. Create New Story
*a. Front* - As a user, I want to Create a New Story so that I can access my saved content on different devices or on reloading.  

*b. Back* -  
   i. The user is redirected to the Story Form to provide details to be filled in that entry.  

---

## 4. Logout
*a. Front* - As a user, I want to be able to Logout so that I can login from other accounts or prevent someone else from accessing without logging in.  

*b. Back* -  
   i. Session is terminated on logout.  
   ii. The user is redirected to the Login Page.  
   iii. Prevents access to stories until re-login.