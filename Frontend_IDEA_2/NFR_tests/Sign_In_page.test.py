# Import test modules
import core_tests
import performance_tests
import security_tests
import reliability_tests
import compatibility_tests
import page_tests

# Sign In page specific configuration
SIGN_IN_URL = "https://quest-ai-frontend.vercel.app/Sign_in"
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "testpassword123"


if __name__ == "__main__":
    
    # Run complete NFR test suite
    page_tests.run_nfr_test_suite(
        page_name="Sign In",
        page_url=SIGN_IN_URL,
        test_email=TEST_EMAIL,
        test_password=TEST_PASSWORD
    )

    # Generate concurrent load report
    page_tests.generate_load_report(
        page_name="Sign In",
        page_url=SIGN_IN_URL,
        graph_prefix="sign_in_page"
    )
