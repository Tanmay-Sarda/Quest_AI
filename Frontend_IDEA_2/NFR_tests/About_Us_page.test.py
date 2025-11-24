import page_tests

# page configuration
ABOUT_URL = "https://quest-ai-frontend.vercel.app/About"
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "testpassword123"


if __name__ == "__main__":
    
    # Run complete NFR test suite
    page_tests.run_nfr_test_suite(
        page_name="About_Us",
        page_url=ABOUT_URL,
    )

    # Generate concurrent load report
    page_tests.generate_load_report(
        page_name="About_Us",
        page_url=ABOUT_URL,
        graph_prefix="About_Us"
    )