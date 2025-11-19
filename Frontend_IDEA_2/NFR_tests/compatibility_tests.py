# compatibility_tests.py
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def test_browser_compatibility(base_url):
    """Test across different browsers (Chrome, Firefox, Edge)"""
    print("\n=== COMPATIBILITY TEST: Multiple Browsers ===")
    
    browsers = [
        ("Chrome", webdriver.Chrome),
        ("Firefox", webdriver.Firefox),
        ("Edge", webdriver.Edge)
    ]
    
    results = []
    
    for browser_name, browser_driver in browsers:
        try:
            print(f"\nTesting {browser_name}...")
            driver = browser_driver()
            driver.get(base_url)
            
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.ID, "email"))
            )
            
            # Check if all key elements are present
            driver.find_element(By.ID, "password")
            driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
            
            print(f"✓ {browser_name}: PASS")
            results.append(True)
            driver.quit()
        except Exception as e:
            print(f"✗ {browser_name}: FAIL - {str(e)}")
            results.append(False)
    
    passed = sum(results)
    total = len(results)
    
    if passed == total:
        print("✓ PASS: Works on at all browser")
        return True
    else:
        print(f"✗ FAIL: Fails on {total - passed} browsers")
        return False
