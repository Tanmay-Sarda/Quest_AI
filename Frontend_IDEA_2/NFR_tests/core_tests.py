import os
import time
from pathlib import Path
from selenium import webdriver
from selenium.common.exceptions import WebDriverException
from selenium.webdriver.support.ui import WebDriverWait


def initialize_driver(headless=True, window_size="1366,900"):
    
    options = webdriver.ChromeOptions()
    options.add_argument("--disable-gpu")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--no-sandbox")
    options.add_argument("--ignore-certificate-errors")
    options.add_argument("--window-size=" + window_size)
    options.add_argument("--disable-infobars")
    options.add_argument("--disable-notifications")
    options.add_argument("--disable-extensions")

    if headless:
        options.add_argument("--headless=new")

    driver = webdriver.Chrome(options=options)
    driver.set_page_load_timeout(30)
    return driver


def wait_browser(driver, timeout=10):

    try:
        WebDriverWait(driver, timeout)
        print("Browser ready")
        return True
    except Exception as e:
        print(f"Browser not ready: {str(e)}. Timeout: {timeout} seconds")
        return False


