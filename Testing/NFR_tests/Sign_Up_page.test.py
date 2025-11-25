import page_tests

# Sign In page specific configuration
SIGN_UP_URL = "https://quest-ai-frontend.vercel.app"
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "testpassword123"


if __name__ == "__main__":
    
    # Run complete NFR test suite
    page_tests.run_nfr_test_suite(
        page_name="sign_up",
        page_url=SIGN_UP_URL,
    )

    # Generate concurrent load report
    page_tests.generate_load_report(
        page_name="Sign Up",
        page_url=SIGN_UP_URL,
        graph_prefix="sign_up_page"
    )