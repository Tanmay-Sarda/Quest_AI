import page_tests

# page configuration
PUBLIC_URL = "https://quest-ai-frontend.vercel.app/Public_Story"
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "testpassword123"


if __name__ == "__main__":
    
    # Run complete NFR test suite
    page_tests.run_nfr_test_suite(
        page_name="Public_Story",
        page_url=PUBLIC_URL,
    )

    # Generate concurrent load report
    page_tests.generate_load_report(
        page_name="Public_Story",
        page_url=PUBLIC_URL,
        graph_prefix="Public_Story",
    )