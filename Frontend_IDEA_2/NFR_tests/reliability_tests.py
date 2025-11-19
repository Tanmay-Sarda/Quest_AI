from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time


def test_empty_form_submission(driver, base_url):
    """Test form behavior when submitted empty"""
    print("\n=== RELIABILITY TEST: Empty Form Submission ===")
    try:
        driver.get(base_url)
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "button[type='submit']"))
        )
        
        # Try to submit without filling fields
        submit_button = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        submit_button.click()
        
        time.sleep(1)
        
        # Should still be on sign in page due to HTML5 validation
        current_url = driver.current_url
        
        if "Sign_in" in current_url:
            print("✓ PASS: Form prevents empty submission")
            return True
        else:
            print("✗ FAIL: Empty form was submitted")
            return False
    except Exception as e:
        print(f"✗ FAIL: {str(e)}")
        return False


def test_invalid_email_format(driver, base_url):
    """Test form behavior with invalid email format"""
    print("\n=== RELIABILITY TEST: Invalid Email Format ===")
    try:
        driver.get(base_url)
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "email"))
        )
        
        # Enter invalid email
        driver.find_element(By.ID, "email").send_keys("notanemail")
        driver.find_element(By.ID, "password").send_keys("password123")
        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        
        time.sleep(1)
        
        # Should still be on sign in page
        current_url = driver.current_url
        
        if "Sign_in" in current_url:
            print("✓ PASS: Invalid email format rejected")
            return True
        else:
            print("✗ FAIL: Invalid email was accepted")
            return False
    except Exception as e:
        print(f"✗ FAIL: {str(e)}")
        return False


def test_concurrent_user_simulation(base_url, concurrent_users=10):
    """Test concurrent user simulation using HTTP requests (no browser overhead)"""
    print("\n=== RELIABILITY TEST: Concurrent Users (HTTP-only) ===")
    import requests
    from concurrent.futures import ThreadPoolExecutor, as_completed
    
    def fetch_page():
        """Single HTTP request to the page"""
        start_time = time.time()
        try:
            response = requests.get(base_url, timeout=10)
            load_time = time.time() - start_time
            return {
                'success': response.status_code == 200,
                'time': load_time,
                'status': response.status_code
            }
        except Exception as e:
            return {
                'success': False,
                'time': time.time() - start_time,
                'error': str(e)
            }
    
    try:
        print(f"Simulating {concurrent_users} concurrent users via HTTP...")
        
        # Execute concurrent requests
        with ThreadPoolExecutor(max_workers=concurrent_users) as executor:
            futures = [executor.submit(fetch_page) for _ in range(concurrent_users)]
            results = [future.result() for future in as_completed(futures)]
        
        # Analyze results
        successful_requests = sum(1 for r in results if r['success'])
        response_times = [r['time'] for r in results if r['success']]
        
        print(f"Successful requests: {successful_requests}/{concurrent_users}")
        
        if response_times:
            avg_response_time = sum(response_times) / len(response_times)
            print(f"Average response time: {avg_response_time:.2f}s")
        
        if successful_requests >= concurrent_users * 0.9:  # 90% success rate
            print("✓ PASS: Handles concurrent users")
            return True
        else:
            print("✗ FAIL: Failed for some concurrent users")
            return False
    except Exception as e:
        print(f"✗ FAIL: {str(e)}")
        return False


def test_browser_back_button(driver, base_url):
    """Test if application handles browser back button properly"""
    print("\n=== RELIABILITY TEST: Browser Back Button ===")
    try:
        driver.get(base_url)
        time.sleep(2)
        
        # Navigate away then back
        driver.get("https://quest-ai-frontend.vercel.app/")
        time.sleep(2)
        driver.back()
        time.sleep(2)
        
        # Check if form is still accessible
        try:
            driver.find_element(By.ID, "email")
            print("✓ PASS: Page state maintained after back button")
            return True
        except:
            print("✗ FAIL: Page broken after back button")
            return False
    except Exception as e:
        print(f"✗ FAIL: {str(e)}")
        return False


def test_page_refresh(driver, base_url):
    """Test if page handles refresh properly"""
    print("\n=== RELIABILITY TEST: Page Refresh ===")
    try:
        driver.get(base_url)
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "email"))
        )
        
        # Fill in some data
        driver.find_element(By.ID, "email").send_keys("test@example.com")
        
        # Refresh page
        driver.refresh()
        time.sleep(2)
        
        # Check if form is cleared and accessible
        email_field = driver.find_element(By.ID, "email")
        email_value = email_field.get_attribute("value")
        
        print(f"Email field value after refresh: '{email_value}'")
        
        if email_value == "":
            print("✓ PASS: Form cleared after refresh")
            return True
        else:
            print("⚠ WARNING: Form data persisted after refresh")
            return True
    except Exception as e:
        print(f"✗ FAIL: {str(e)}")
        return False
