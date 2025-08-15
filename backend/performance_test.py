#!/usr/bin/env python3
"""
Performance testing script for TU Report Analyzer
Tests both parallel and batch analysis modes
"""

import time
import requests
import os
from pathlib import Path

def test_analysis_performance(file_path, endpoint="/analyze", max_pages=5):
    """Test analysis performance for a given endpoint"""
    if not os.path.exists(file_path):
        print(f"❌ Test file not found: {file_path}")
        return None
    
    print(f"🧪 Testing {endpoint} with {max_pages} pages...")
    
    start_time = time.time()
    
    try:
        with open(file_path, 'rb') as f:
            files = {'file': f}
            params = {'max_pages': max_pages}
            
            response = requests.post(
                f"http://localhost:8000{endpoint}",
                files=files,
                params=params,
                timeout=300  # 5 minutes timeout
            )
            
            if response.status_code == 200:
                end_time = time.time()
                duration = end_time - start_time
                
                data = response.json()
                pages_analyzed = data.get('total_pages_analyzed', 0)
                errors_found = data.get('total_errors_found', 0)
                
                print(f"✅ Success! Analyzed {pages_analyzed} pages in {duration:.2f} seconds")
                print(f"   📊 Errors found: {errors_found}")
                print(f"   ⚡ Speed: {pages_analyzed/duration:.2f} pages/second")
                
                return {
                    'endpoint': endpoint,
                    'duration': duration,
                    'pages_analyzed': pages_analyzed,
                    'errors_found': errors_found,
                    'pages_per_second': pages_analyzed/duration
                }
            else:
                print(f"❌ Error: {response.status_code} - {response.text}")
                return None
                
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        return None

def main():
    print("🚀 TU Report Analyzer Performance Test")
    print("=" * 50)
    
    # Look for test PDF files
    test_files = []
    
    # Check temp directory
    temp_dir = Path("temp")
    if temp_dir.exists():
        for pdf_file in temp_dir.glob("*.pdf"):
            test_files.append(str(pdf_file))
    
    # Check current directory
    for pdf_file in Path(".").glob("*.pdf"):
        test_files.append(str(pdf_file))
    
    if not test_files:
        print("❌ No PDF files found for testing!")
        print("   Please place a PDF file in the 'temp' directory or current directory")
        return
    
    print(f"📁 Found {len(test_files)} test file(s):")
    for file in test_files:
        print(f"   - {file}")
    
    # Test with first available file
    test_file = test_files[0]
    print(f"\n🎯 Using test file: {test_file}")
    
    # Test both endpoints
    results = []
    
    # Test parallel analysis
    parallel_result = test_analysis_performance(test_file, "/analyze", max_pages=5)
    if parallel_result:
        results.append(parallel_result)
    
    print("\n" + "-" * 30)
    
    # Test batch analysis
    batch_result = test_analysis_performance(test_file, "/analyze-batch", max_pages=5)
    if batch_result:
        results.append(batch_result)
    
    # Compare results
    if len(results) >= 2:
        print("\n📈 PERFORMANCE COMPARISON:")
        print("=" * 50)
        
        parallel = results[0]
        batch = results[1]
        
        speed_improvement = (batch['pages_per_second'] / parallel['pages_per_second'] - 1) * 100
        time_saved = parallel['duration'] - batch['duration']
        
        print(f"Parallel Analysis:  {parallel['pages_per_second']:.2f} pages/sec")
        print(f"Batch Analysis:     {batch['pages_per_second']:.2f} pages/sec")
        print(f"Speed Improvement:  {speed_improvement:+.1f}%")
        print(f"Time Saved:         {time_saved:.2f} seconds")
        
        if speed_improvement > 0:
            print(f"🎉 Batch analysis is {speed_improvement:.1f}% faster!")
        else:
            print(f"⚠️  Parallel analysis is {abs(speed_improvement):.1f}% faster")
    
    print("\n✨ Performance test completed!")

if __name__ == "__main__":
    main()
