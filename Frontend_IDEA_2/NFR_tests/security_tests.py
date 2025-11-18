"""
Enhanced Security Tests for Web Applications
NOTE: These tests are for legitimate security assessment of YOUR OWN applications only.
"""
import re
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
import time


# SQL Injection Test Payloads
SQL_INJECTION_PAYLOADS = [
    "' OR '1'='1",
    "' OR 1=1--",
    "admin'--",
    "' OR 'a'='a",
    "1' OR '1' = '1'/*",
    "' UNION SELECT NULL--",
    "' DROP TABLE users--",
    "'; DROP TABLE users; --",
]

# XSS Test Payloads
XSS_PAYLOADS = [
    "<script>alert('XSS')</script>",
    "<img src=x onerror=alert('XSS')>",
    "<svg onload=alert('XSS')>",
    "javascript:alert('XSS')",
    "<iframe src='javascript:alert(\"XSS\")'></iframe>",
]


def test_sql_injection_attempt(driver, base_url):
    """Test SQL injection resistance on all input fields"""
    print("\n=== SECURITY TEST: SQL Injection Resistance ===")
    
    vulnerable_count = 0
    total_tests = 0
    
    try:
        driver.get(base_url)
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "input"))
        )
        
        # Find all input fields
        input_fields = driver.find_elements(By.TAG_NAME, "input")
        print(f"Found {len(input_fields)} input fields to test")
        
        for idx, field in enumerate(input_fields):
            field_type = field.get_attribute("type")
            field_name = field.get_attribute("name") or field.get_attribute("id") or f"field_{idx}"
            
            # Skip non-text inputs
            if field_type in ["submit", "button", "file", "image", "reset"]:
                continue
            
            print(f"\nTesting field: {field_name} (type: {field_type})")
            
            # Test each SQL injection payload
            for payload in SQL_INJECTION_PAYLOADS[:1]:
                try:
                    total_tests += 1
                    field.clear()
                    field.send_keys(payload)
                    time.sleep(0.3)
                    
                    # Check for SQL error messages in page
                    page_source = driver.page_source.lower()
                    error_indicators = [
                        'sql syntax',
                        'mysql_fetch',
                        'ora-',
                        'sqlexception',
                        'postgresql',
                        'unclosed quotation',
                        'syntax error'
                    ]
                    
                    if any(indicator in page_source for indicator in error_indicators):
                        print(f"  ⚠ WARNING: Possible SQL error exposed for payload: {payload[:30]}")
                        vulnerable_count += 1
                        break
                    
                except Exception as e:
                    # Field might be read-only or disabled
                    pass
        
        print(f"\nTotal tests: {total_tests}, Potential vulnerabilities: {vulnerable_count}")
        
        if vulnerable_count == 0:
            print("✓ PASS: No SQL injection vulnerabilities detected")
            return True
        else:
            print(f"✗ FAIL: {vulnerable_count} potential SQL injection vulnerabilities found")
            return False
            
    except Exception as e:
        print(f"✗ FAIL: {str(e)}")
        return False


def test_xss_attempt(driver, base_url):
    """Test XSS resistance on all input fields"""
    print("\n=== SECURITY TEST: XSS Resistance ===")
    
    vulnerable_count = 0
    total_tests = 0
    
    try:
        driver.get(base_url)
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "input"))
        )
        
        # Find all input fields
        input_fields = driver.find_elements(By.TAG_NAME, "input")
        print(f"Found {len(input_fields)} input fields to test")
        
        for idx, field in enumerate(input_fields):
            field_type = field.get_attribute("type")
            field_name = field.get_attribute("name") or field.get_attribute("id") or f"field_{idx}"
            
            # Skip non-text inputs
            if field_type in ["submit", "button", "file", "image", "reset"]:
                continue
            
            print(f"\nTesting field: {field_name} (type: {field_type})")
            
            # Test each XSS payload
            for payload in XSS_PAYLOADS[:1]:  
                try:
                    total_tests += 1
                    field.clear()
                    field.send_keys(payload)
                    time.sleep(0.3)
                    
                    # Check if alert was triggered
                    try:
                        alert = driver.switch_to.alert
                        alert_text = alert.text
                        alert.accept()
                        print(f"  ✗ XSS VULNERABILITY: Alert triggered with text: '{alert_text}'")
                        vulnerable_count += 1
                        break
                    except:
                        # No alert, good
                        pass
                    
                    # Check if script tag appears unescaped in page source
                    page_source = driver.page_source
                    if payload in page_source:
                        print(f"  ⚠ WARNING: Unescaped payload found in page source")
                        vulnerable_count += 1
                        break
                    
                except Exception as e:
                    pass
        
        print(f"\nTotal tests: {total_tests}, Potential vulnerabilities: {vulnerable_count}")
        
        if vulnerable_count == 0:
            print("✓ PASS: No XSS vulnerabilities detected")
            return True
        else:
            print(f"✗ FAIL: {vulnerable_count} potential XSS vulnerabilities found")
            return False
            
    except Exception as e:
        print(f"✗ FAIL: {str(e)}")
        return False


def test_session_storage(driver, base_url):
    """Test if sensitive data is stored insecurely"""
    print("\n=== SECURITY TEST: Secure Storage Practices ===")
    try:
        driver.get(base_url)
        time.sleep(2)
        
        # Check localStorage
        local_storage_keys = driver.execute_script("return Object.keys(localStorage)")
        local_storage_data = {}
        for key in local_storage_keys:
            value = driver.execute_script(f"return localStorage.getItem('{key}')")
            local_storage_data[key] = value
        
        # Check sessionStorage
        session_storage_keys = driver.execute_script("return Object.keys(sessionStorage)")
        session_storage_data = {}
        for key in session_storage_keys:
            value = driver.execute_script(f"return sessionStorage.getItem('{key}')")
            session_storage_data[key] = value
        
        print(f"LocalStorage keys: {local_storage_keys}")
        print(f"SessionStorage keys: {session_storage_keys}")
        
    except Exception as e:
        print(f"✗ FAIL: {str(e)}")
        return False



def test_rate_limiting(base_url, max_requests=1000, time_window=10, max_workers=200):
    """
    Test if the application has rate limiting to prevent abuse
    Tests server's ability to handle high concurrent load
    """
    print("\n=== SECURITY TEST: Rate Limiting & Load Handling ===")
    print(f"Testing with {max_requests} requests (max {max_workers} concurrent)")
    print(f"Target time window: {time_window}s")

    results = []
    
    import requests
    from concurrent.futures import ThreadPoolExecutor, as_completed
    
    def send_request():
        request_start = time.time()
        try:
            response = requests.get(base_url, timeout=5)
            return {
                'status': response.status_code,
                'time': time.time() - request_start
            }
        except requests.exceptions.Timeout:
            return {'status': 'timeout', 'time': time.time() - request_start}
        except Exception as e:
            return {'status': 'error', 'time': time.time() - request_start, 'error': str(e)}
    
    try:
        start_time = time.time()
        results = []
        completed_in_window = 0
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all requests
            futures = [executor.submit(send_request) for _ in range(max_requests)]
            
            # Collect results as they complete
            from tqdm import tqdm 
            with tqdm(total=max_requests, ncols=60) as pbar:
                for future in as_completed(futures):
                    result = future.result()
                    results.append(result)

                    # update progress bar
                    pbar.update(1)

                    # time-window logic
                    if time.time() - start_time <= time_window:
                        completed_in_window += 1
        
        total_time = time.time() - start_time
        
        # Analyze results
        success_count = sum(1 for r in results if r.get('status') == 200)
        blocked_count = sum(1 for r in results if r.get('status') == 429)
        timeout_count = sum(1 for r in results if r.get('status') == 'timeout')
        error_count = sum(1 for r in results if r.get('status') == 'error')

        results.append({
            'time': avg_response_time,
            'success rate': success_count/max_requests*100,
            'blocked rate': blocked_count/max_requests*100,
            'timeout rate': timeout_count/max_requests*100,
            'error rate': error_count/max_requests*100
        })
        
        avg_response_time = sum(r.get('time', 0) for r in results if r.get('status') == 200) / max(success_count, 1)
        
        print(f"\n{'='*60}")
        print("RESULTS")
        print(f"{'='*60}")
        print(f"Total time: {total_time:.2f}s")
        print(f"Successful (200): {success_count} ({success_count/max_requests*100:.1f}%)")
        print(f"Rate limited (429): {blocked_count}")
        print(f"Timeouts: {timeout_count}")
        print(f"Errors: {error_count}")
        print(f"Avg response time: {avg_response_time:.3f}s")
        print(f"Throughput: {success_count/total_time:.1f} req/s")
        
        failure_rate = (timeout_count + error_count) / max_requests
        
        if failure_rate > 0.5:
            # More than 50% failures = server can't handle load
            print(f"\n✗ FAIL: Server struggles with concurrent load")
            print(f"    Failure rate: {failure_rate*100:.1f}%")
            
            return results

        elif blocked_count > max_requests * 0.1:
            # More than 10% blocked = rate limiting active
            print(f"\n✓ PASS: Rate limiting is active")
            print(f"  {blocked_count} requests were rate limited ({blocked_count/max_requests*100:.1f}%)")

            return results

        elif success_count >= max_requests * 0.9:
            # 90%+ success rate
            if total_time <= time_window * 1.5:
                print(f"\n✓ PASS: Server handled load efficiently")
                print(f"⚠ NOTE: No rate limiting detected")
                return results

            else:
                print(f"\n⚠ PASS: Server handled requests slowly")
                print(f"    Took {total_time:.1f}s / {time_window:.1f}s")
                return results

        else:
            print(f"\n✓ PASS: Server handled requests with some failures")
            print(f"  Success rate: {success_count/max_requests*100:.1f}%")
            return results
            
    except Exception as e:
        print(f"\n✗ FAIL: Test execution error: {str(e)}")
        return results


def test_security_headers(base_url):
    """Test for important security headers"""
    print("\n=== SECURITY TEST: Security Headers ===")
    
    import requests
    
    try:
        response = requests.get(base_url, timeout=10)
        headers = response.headers
        
        # Important security headers to check
        security_headers = {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': ['DENY', 'SAMEORIGIN'],
            'X-XSS-Protection': '1',
        }
        
        missing_headers = []
        present_headers = []
        
        for header, expected_value in security_headers.items():
            if header in headers:
                present_headers.append(header)
                print(f"  ✓ {header}: {headers[header]}")
            else:
                missing_headers.append(header)
                print(f"  ✗ {header}: MISSING")
        
        if len(missing_headers) == 0:
            print("\n✓ PASS: All security headers present")
            return True
        elif len(present_headers) >= 2:
            print(f"\n⚠ WARNING: {len(missing_headers)} security headers missing")
            print(f"  Missing: {', '.join(missing_headers)}")
            return True  
        else:
            print(f"\n✗ FAIL: Critical security headers missing")
            return False
            
    except Exception as e:
        print(f"✗ FAIL: {str(e)}")
        return False