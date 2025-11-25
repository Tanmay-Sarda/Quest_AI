import page_tests

# Sign In page specific configuration
SIGN_IN_URL = "https://quest-ai-frontend.vercel.app/Login"
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "testpassword123"


if __name__ == "__main__":
    
    # Run complete NFR test suite
    page_tests.run_nfr_test_suite(
        page_name="Login",
        page_url=SIGN_IN_URL
    )

    # Generate concurrent load report
    page_tests.generate_load_report(
        page_name="Login",
        page_url=SIGN_IN_URL,
        graph_prefix="Login_page"
    )
