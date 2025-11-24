"""
Common test utilities for Sign In and Sign Up page testing
"""
from doctest import REPORT_CDIFF
import core_tests
import performance_tests
import security_tests
import reliability_tests
import compatibility_tests
from pathlib import Path


def run_nfr_test_suite(page_name, page_url):
    """
    Run complete NFR test suite for a given page
    """
    print("=" * 60)
    print(f"NFR TESTING SUITE FOR QUEST AI - {page_name.upper()} PAGE")
    print("=" * 60)
    
    # Initialize driver
    driver = core_tests.initialize_driver()
    
    # Wait for browser to be ready
    if not core_tests.wait_browser(driver):
        print("✗ FAIL: Browser not ready")
        driver.quit()
        return False
    
    results = {}
    
    # Performance Tests
    print("\n" + "=" * 60)
    print("PERFORMANCE TESTS")
    print("=" * 60)
    results['Page Load Time'] = performance_tests.test_load_time_single_load(driver, page_url)
    results['Average Response Time'] = performance_tests.test_response_time_multiple_loads(driver, page_url)
    results['Concurrent Load (Server-Side)'] = performance_tests.test_concurrent_load_server_side(page_url)
    
    # Security Tests
    print("\n" + "=" * 60)
    print("SECURITY TESTS")
    print("=" * 60)
    results['SQL Injection Resistance'] = security_tests.test_sql_injection_attempt(driver, page_url)
    results['XSS Resistance'] = security_tests.test_xss_attempt(driver, page_url)
    results['Session Storage Usage'] = security_tests.test_session_storage(driver, page_url)
    results['Rate Limiting'] = security_tests.test_rate_limiting(page_url)

    
    # Reliability Tests
    print("\n" + "=" * 60)
    print("RELIABILITY TESTS")
    print("=" * 60)

    if page_name == "Login" or page_name == "Sign_Up":
        results['Empty Form Submission'] = reliability_tests.test_empty_form_submission(driver, page_url)
        results['Invalid Email Format'] = reliability_tests.test_invalid_email_format(driver, page_url)
    
    results['Concurrent Users'] = reliability_tests.test_concurrent_user_simulation(page_url)
    
    if page_name == "Login" or page_name == "Sign_Up":
        results['Browser Back Button'] = reliability_tests.test_browser_back_button(driver, page_url)
        results['Page Refresh'] = reliability_tests.test_page_refresh(driver, page_url)
    
    # Compatibility Tests
    print("\n" + "=" * 60)
    print("COMPATIBILITY TESTS")
    print("=" * 60)
    results['Browser Compatibility'] = compatibility_tests.test_browser_compatibility(page_url)
    
    driver.quit()
    
    # Print summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for result in results.values() if result)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{test_name}: {status}")
    
    print(f"\nOverall: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    print(f"{total - passed} tests failed")
    report_dir = Path("nfr_load_reports") / f"{page_name}_page_report"
    report_dir.mkdir(parents=True, exist_ok=True)  # Create directory if it doesn't exist

    summary_file = report_dir / f"{page_name}_tests_summary.txt"
    with open(summary_file, 'w', encoding='utf-8') as f:
        f.write(f"Overall: {passed}/{total} tests passed ({passed/total*100:.1f}%)\n")
        f.write(f"{total - passed} tests failed\n")
        for test_name, result in results.items():
            status = "✓ PASS" if result else "✗ FAIL"
            f.write(f"{test_name}: {status}\n")
    return passed == total


def generate_load_report(page_name, page_url, graph_prefix):
    """
    Generate enhanced concurrent load report for a page
    """
    print("\n" + "=" * 80)
    print(f"GENERATING CONCURRENT LOAD REPORT FOR {page_name.upper()} PAGE")
    print("=" * 80)
    
    # Generate the report
    report_summary = performance_tests.generate_concurrent_load_report(
        base_url=page_url,
        output_dir="nfr_load_reports",
        graph_prefix=graph_prefix,
        folder_name=graph_prefix
    )
    
    # Display key insights
    print("\n" + "=" * 80)
    print("KEY INSIGHTS FROM LOAD TESTING")
    print("=" * 80)
    
    insights = report_summary.get('insights', [])
    for insight in insights:
        print(f"\n[{insight['type'].upper()}] {insight['title']}")
        print(f"  {insight['description']}")
    
    print(f"\nFull report saved to: {report_summary['metadata']['report_folder']}")
    print(f"{len(report_summary['graphs'])} graph files generated")
    
    return report_summary