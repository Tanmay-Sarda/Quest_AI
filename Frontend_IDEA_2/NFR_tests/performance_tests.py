from turtle import color
from typing import Any


from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import statistics
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
import matplotlib.pyplot as plt
import numpy as np
import json
from pathlib import Path


def test_load_time_single_load(driver, base_url, max_load_time=3):
    """Test if page loads within acceptable time"""
    print("\n=== PERFORMANCE TEST: Page Load Time ===")
    try:
        start_time = time.time()
        driver.get(base_url)
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "email"))
        )
        load_time = time.time() - start_time
        
        print(f"Page Load Time: {load_time:.2f} seconds")
        
        if load_time < max_load_time:
            print("✓ PASS: Page loads within acceptable time")
            return True
        else:
            print("✗ FAIL: Page takes too long to load")
            return False
    except Exception as e:
        print(f"✗ FAIL: {str(e)}")
        return False


def test_response_time_multiple_loads(driver, base_url, num_loads=5, max_avg_time=3):
    """Test average response time over multiple page loads"""
    print("\n=== PERFORMANCE TEST: Average Response Time ===")
    load_times = []
    
    try:
        for i in range(num_loads):
            start_time = time.time()
            driver.get(base_url)
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.ID, "email"))
            )
            load_time = time.time() - start_time
            load_times.append(load_time)
            print(f"Load {i+1}: {load_time:.2f}s")
            time.sleep(1)
        
        avg_time = statistics.mean(load_times)
        std_dev = statistics.stdev(load_times)
        
        print(f"\nAverage Load Time: {avg_time:.2f}s")
        print(f"Standard Deviation: {std_dev:.2f}s")
        
        if avg_time < max_avg_time:
            print("✓ PASS: Average load time acceptable")
            return True
        else:
            print("✗ FAIL: Average load time too high")
            return False
    except Exception as e:
        print(f"✗ FAIL: {str(e)}")
        return False


def test_concurrent_load_server_side(base_url, concurrent_users=10, success_rate_threshold=90, max_response_time=5):
    """Test concurrent load using HTTP requests"""
    print("\n=== PERFORMANCE TEST: Concurrent Load (Server-Side) ===")
    
    def fetch_page():
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
        print(f"Simulating {concurrent_users} concurrent users...")
        
        with ThreadPoolExecutor(max_workers=concurrent_users) as executor:
            futures = [executor.submit(fetch_page) for _ in range(concurrent_users)]
            results = [future.result() for future in as_completed(futures)]
        
        successful_requests = sum(1 for r in results if r['success'])
        response_times = [r['time'] for r in results if r['success']]
        
        print(f"Successful requests: {successful_requests}/{concurrent_users}")
        
        if response_times:
            avg_response_time = sum(response_times) / len(response_times)
            print(f"Average response time: {avg_response_time:.2f}s")
        
        success_rate = (successful_requests / concurrent_users) * 100
        
        if success_rate >= success_rate_threshold and (not response_times or avg_response_time <= max_response_time):
            print("✓ PASS: Concurrent load test passed")
            return True
        else:
            print("✗ FAIL: Server struggles with concurrent load")
            return False
            
    except Exception as e:
        print(f"✗ FAIL: {str(e)}")
        return False


def _fetch_page(base_url):
    """Helper function to fetch a page via HTTP"""
    start_time = time.time()
    try:
        response = requests.get(base_url, timeout=10)
        load_time = time.time() - start_time
        return {
            'success': response.status_code == 200,
            'time': load_time,
            'status': response.status_code,
            'timestamp': start_time
        }
    except Exception as e:
        return {
            'success': False,
            'time': time.time() - start_time,
            'error': str(e),
            'timestamp': start_time
        }


def _test_concurrent_load(base_url, num_users):
    """Helper function to test concurrent load for a specific user count"""
    print(f"\nTesting {num_users} concurrent users...")
    start_time = time.time()
    
    with ThreadPoolExecutor(max_workers=num_users) as executor:
        futures = [executor.submit(_fetch_page, base_url) for _ in range(num_users)]
        results = [future.result() for future in as_completed(futures)]
    
    total_time = time.time() - start_time
    
    successful_requests = sum(1 for r in results if r['success'])
    failed_requests = num_users - successful_requests
    response_times = [r['time'] for r in results if r['success']]
    errors = [r.get('error', 'Unknown') for r in results if not r['success']]
    
    if response_times:
        avg_response_time = statistics.mean(response_times)
        min_response_time = min(response_times)
        max_response_time = max(response_times)
        std_dev = statistics.stdev(response_times) if len(response_times) > 1 else 0
        median_response_time = statistics.median(response_times)
        p95_response_time = np.percentile(response_times, 95)
        p99_response_time = np.percentile(response_times, 99)
    else:
        avg_response_time = min_response_time = max_response_time = 0
        median_response_time = p95_response_time = p99_response_time = 0
        std_dev = 0
    
    success_rate = (successful_requests / num_users) * 100
    throughput = successful_requests / total_time if total_time > 0 else 0
    
    return {
        'users': num_users,
        'successful': successful_requests,
        'failed': failed_requests,
        'success_rate': success_rate,
        'avg_response_time': avg_response_time,
        'min_response_time': min_response_time,
        'max_response_time': max_response_time,
        'median_response_time': median_response_time,
        'p95_response_time': p95_response_time,
        'p99_response_time': p99_response_time,
        'std_dev': std_dev,
        'total_time': total_time,
        'throughput': throughput,
        'response_times': response_times,
        'errors': errors
    }


def _create_graphs(results, base_url, report_dir, prefix):
    """Create essential performance graphs"""
    graph_files = []
    
    users = [r['users'] for r in results]
    success_rates = [r['success_rate'] for r in results]
    throughputs = [r['throughput'] for r in results]
    avg_response_times = [r['avg_response_time'] for r in results]
    
    # Graph 1: Throughput vs Users
    plt.figure(figsize=(10, 6))
    plt.plot(users, throughputs, 'o-')
    plt.xlabel('Number of Concurrent Users')
    plt.ylabel('Throughput (requests/second)')
    plt.title(f'Throughput vs Concurrent Users\n{base_url}')
    plt.grid(True)
    
    file1 = report_dir / f"{prefix}_throughput.png"
    plt.tight_layout()
    plt.savefig(file1)
    plt.close()
    graph_files.append(str(file1))
    
    # Graph 2: Success Rate vs Users
    plt.figure(figsize=(10, 6))
    plt.plot(users, success_rates, 'o-', color='green')
    plt.xlabel('Number of Concurrent Users')
    plt.ylabel('Success Rate (%)')
    plt.title(f'Success Rate vs Concurrent Users\n{base_url}')
    plt.grid(True)
    plt.ylim(0, 105)
    
    file2 = report_dir / f"{prefix}_success_rate.png"
    plt.tight_layout()
    plt.savefig(file2)
    plt.close()
    graph_files.append(str(file2))
    
    # Graph 3: Average Response Time vs Users
    plt.figure(figsize=(10, 6))
    plt.plot(users, avg_response_times, 'o-', color='red')
    plt.xlabel('Number of Concurrent Users')
    plt.ylabel('Average Response Time (seconds)')
    plt.title(f'Response Time vs Concurrent Users\n{base_url}')
    plt.grid(True)
    
    file3 = report_dir / f"{prefix}_response_time.png"
    plt.tight_layout()
    plt.savefig(file3)
    plt.close()
    graph_files.append(str(file3))
    
    return graph_files


def _generate_insights(results, user_counts):
    """Generate actionable insights from test results"""
    insights = []
    
    # Find breaking point
    breaking_point = None
    for result in results:
        if result['success_rate'] < 95:
            breaking_point = result['users']
            break
    
    if breaking_point:
        insights.append({
            'type': 'warning',
            'title': 'Performance Degradation Detected',
            'description': f'System success rate drops below 95% at {breaking_point} concurrent users',
            'recommendation': 'Consider implementing load balancing, caching, or horizontal scaling'
        })
    else:
        insights.append({
            'type': 'success',
            'title': 'Excellent Scalability',
            'description': f'System maintains >95% success rate up to {max(user_counts)} concurrent users',
            'recommendation': 'Monitor performance as traffic grows beyond tested range'
        })
    
    # Response time analysis
    avg_response_times = [r['avg_response_time'] for r in results]
    if avg_response_times:
        max_avg_time = max(avg_response_times)
        if max_avg_time > 3.0:
            insights.append({
                'type': 'warning',
                'title': 'High Response Times',
                'description': f'Average response time reaches {max_avg_time:.2f}s under load',
                'recommendation': 'Optimize database queries, implement caching, or reduce computational complexity'
            })
    
    # Throughput analysis
    throughputs = [r['throughput'] for r in results]
    if len(throughputs) > 1:
        peak_throughput = max(throughputs)
        peak_users = results[throughputs.index(peak_throughput)]['users']
        insights.append({
            'type': 'info',
            'title': 'Peak Throughput',
            'description': f'Maximum throughput of {peak_throughput:.1f} req/s achieved at {peak_users} concurrent users',
            'recommendation': 'Monitor for throughput degradation beyond this point'
        })
    
    return insights


def _create_readable_summary(results, insights, report_dir, prefix):
    """Create a readable summary file"""
    summary_file = report_dir / f"{prefix}_summary.txt"
    
    with open(summary_file, 'w', encoding='utf-8') as f:
        f.write("=" * 80 + "\n")
        f.write("CONCURRENT LOAD TESTING REPORT\n")
        f.write("=" * 80 + "\n\n")
        
        f.write("EXECUTIVE SUMMARY\n")
        f.write("-" * 80 + "\n")
        for insight in insights:
            f.write(f"\n[{insight['type'].upper()}] {insight['title']}\n")
            f.write(f"  Description: {insight['description']}\n")
            f.write(f"  Recommendation: {insight['recommendation']}\n")
        
        f.write("\n\n" + "=" * 80 + "\n")
        f.write("DETAILED RESULTS\n")
        f.write("=" * 80 + "\n\n")
        
        f.write(f"{'Users':<10} {'Success%':<12} {'Avg Time(s)':<15} {'Median(s)':<12} {'P95(s)':<10} {'Throughput':<12}\n")
        f.write("-" * 80 + "\n")
        
        for result in results:
            f.write(f"{result['users']:<10} {result['success_rate']:<12.1f} "
                   f"{result['avg_response_time']:<15.3f} {result['median_response_time']:<12.3f} "
                   f"{result['p95_response_time']:<10.3f} {result['throughput']:<12.1f}\n")
    
    return str(summary_file)


def generate_concurrent_load_report(
    base_url,
    output_dir="load_reports",
    user_counts=[1, 2, 5, 10, 20, 50, 70, 90, 100],
    graph_prefix=None,
    folder_name=None
):
    """Generate comprehensive concurrent load testing report"""
    
    # Setup report directory
    report_name = folder_name or graph_prefix or "load_test"
    report_dir = Path(output_dir) / f"{report_name}_report"
    
    if report_dir.exists():
        import shutil
        shutil.rmtree(report_dir)
    
    report_dir.mkdir(parents=True)
    prefix = graph_prefix or "load_test"
    
    # Print header
    print("=" * 80)
    print("CONCURRENT LOAD TESTING REPORT")
    print("=" * 80)
    print(f"Target URL: {base_url}")
    print(f"Output folder: {report_dir}")
    
    # Run tests
    results = []
    for users in user_counts:
        result = _test_concurrent_load(base_url, users)
        results.append(result)
        print(f"  Success Rate: {result['success_rate']:.1f}% ({result['successful']}/{users})")
        print(f"  Throughput: {result['throughput']:.1f} req/s")
        print(f"  Avg Response Time: {result['avg_response_time']:.3f}s")
        if result['errors']:
            unique_errors = list(set(result['errors']))
            print(f"  Errors: {len(result['errors'])} total, types: {unique_errors}")
    
    # Generate outputs
    graph_files = _create_graphs(results, base_url, report_dir, prefix)
    insights = _generate_insights(results, user_counts)
    summary_file = _create_readable_summary(results, insights, report_dir, prefix)
    
    # Create JSON summary
    json_summary = {
        'metadata': {
            'url': base_url,
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'user_counts': user_counts,
            'report_folder': str(report_dir),
            'test_name': report_name
        },
        'results': results,
        'insights': insights,
        'graphs': graph_files
    }
    
    json_file = report_dir / f"{prefix}_summary.json"
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(json_summary, f, indent=2, ensure_ascii=False)
    
    print(f"\nReport saved to: {report_dir}")
    print(f"Summary: {summary_file}")
    print(f"JSON: {json_file}")
    print(f"Graphs: {len(graph_files)} files")
    
    return json_summary