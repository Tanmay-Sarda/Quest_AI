## Sprint 4

### Sprint Goal
Deploy the **Frontend**, **Backend**, and **LLM API**.  
Improve new frontend.
Introduce **genre** and **style prompts** in the **LLM API**.
Test the new features and fix bugs.
Add OTP verification and forgot password to the backend.

---

### Order of Completion

#### Week 1
1. **OTP Verification System Implementation**
   - Created OTP model.
   - Implemented OTP-based email verification for user signup flow.
   - Added OTP verification for login authentication.
   - Built frontend OTP verification page with 6-digit input interface.

2. **Genre Integration with Backend**
   - Integrated genre selection with backend story creation.
   - Added genre parameter to story creation API endpoints.
   - Enhanced storyteller prompts to handle genre-specific story generation.
   - Updated prompt templates to incorporate genre context in story setup and continuation.

3. **Frontend UI Improvements**
   - Refined button styles and interactions.
   - Added Animations to improve user experience.
   - Enhanced StoryCard component.


---

#### Week 2
1. **Forgot Password Feature**
   - Created complete forgot password backend flow with OTP verification.
   - Implemented password reset endpoint requiring verified OTP.
   - Added frontend forgot password page with email input and OTP verification.
   - Integrated password reset functionality with OTP verification step.

2. **LLM API Style and Dialect Enhancements**
   - Improved dialect/style detection for both original stories and fanfiction.
   - Implemented automatic style extraction for fanfiction stories.
   - Enhanced prompt templates to maintain style consistency across story continuation.
   - Refactored to use Llama 3.3 70B model for story generation.

3. **Chatbox and Story Display Improvements**
   - Enhanced chatbox UI with character name display.
   - Added loading animation for story generation.
   - Fixed prompt display issues during LLM response wait.
   - Improved story card component layout and styles.
   - Fixed dynamic footer positioning.

---

#### Week 3
1. **Backend and API Enhancements**
   - Fixed story creation validation (prompt field requirements).
   - Improved story continuation flow with better error handling.
   - Added character name extraction from story owner data.
   - Enhanced story content formatting and display.

2. **Responsive Design**
   - Made all pages responsive (fixed OTP page responsiveness).
   - Updated test cases for story creation and continuation.
   - Added test pages for various components.
   - Fixed various UI/UX inconsistencies and alignment issues.

3. **Testing**
   - Added unit tests for LLM API and story creation.
   - Added unit tests for Backend API.


3. **Deployment**
   - Deploy Frontend to production environment.
   - Deploy Backend API to production server.
   - Deploy LLM API (FastAPI) to production environment.

---

### Sprint 4 Backlog (Remaining + New Tasks)


1. **Performance Optimization**
   - Optimize API response times and reduce latency.
   - Implement caching strategies for frequently accessed data.
   - Optimize database queries and indexing.
   - Improve frontend load times.

2. **Additional Features and Refinements**
   - Add multiple options for story export functionality (PDF, doc file, etc.).
   - Add story bookmarking and favorites feature.
   - Enhance user profile with story statistics.
   - Implement a search bar for story search and filtering.


---