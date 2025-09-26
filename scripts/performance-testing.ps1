# Performance Testing and Load Testing Script
param(
    [string]$Domain = "waste-management.jp",
    [int]$ConcurrentUsers = 100,
    [int]$TestDuration = 300
)

Write-Host "⚡ Starting performance testing..." -ForegroundColor Blue

# Create performance test scenarios
Write-Host "📋 Creating performance test scenarios..." -ForegroundColor Blue

# Scenario 1: User Login Load Test
$LoginTestScript = @"
import requests
import threading
import time
import json
from concurrent.futures import ThreadPoolExecutor
import statistics

class PerformanceTest:
    def __init__(self, base_url, concurrent_users=100, duration=300):
        self.base_url = base_url
        self.concurrent_users = concurrent_users
        self.duration = duration
        self.results = []
        self.errors = []
        
    def login_test(self):
        """Test user login performance"""
        start_time = time.time()
        try:
            response = requests.post(
                f"{self.base_url}/api/auth/login",
                json={"email": "test@example.com", "password": "testpassword"},
                timeout=10
            )
            end_time = time.time()
            
            result = {
                "endpoint": "login",
                "status_code": response.status_code,
                "response_time": end_time - start_time,
                "timestamp": start_time
            }
            
            if response.status_code == 200:
                self.results.append(result)
            else:
                self.errors.append(result)
                
        except Exception as e:
            self.errors.append({
                "endpoint": "login",
                "error": str(e),
                "timestamp": time.time()
            })
    
    def case_creation_test(self):
        """Test case creation performance"""
        start_time = time.time()
        try:
            response = requests.post(
                f"{self.base_url}/api/cases",
                json={
                    "wasteType": "一般廃棄物",
                    "description": "Performance test case",
                    "siteAddress": "東京都渋谷区恵比寿1-1-1",
                    "siteLat": 35.6762,
                    "siteLng": 139.6503
                },
                timeout=10
            )
            end_time = time.time()
            
            result = {
                "endpoint": "create_case",
                "status_code": response.status_code,
                "response_time": end_time - start_time,
                "timestamp": start_time
            }
            
            if response.status_code in [200, 201]:
                self.results.append(result)
            else:
                self.errors.append(result)
                
        except Exception as e:
            self.errors.append({
                "endpoint": "create_case",
                "error": str(e),
                "timestamp": time.time()
            })
    
    def photo_upload_test(self):
        """Test photo upload performance"""
        start_time = time.time()
        try:
            # Create a dummy image file
            dummy_image = b"dummy_image_data_for_testing"
            
            response = requests.post(
                f"{self.base_url}/api/photos/upload",
                files={"file": ("test.jpg", dummy_image, "image/jpeg")},
                data={"description": "Performance test photo"},
                timeout=30
            )
            end_time = time.time()
            
            result = {
                "endpoint": "upload_photo",
                "status_code": response.status_code,
                "response_time": end_time - start_time,
                "timestamp": start_time
            }
            
            if response.status_code in [200, 201]:
                self.results.append(result)
            else:
                self.errors.append(result)
                
        except Exception as e:
            self.errors.append({
                "endpoint": "upload_photo",
                "error": str(e),
                "timestamp": time.time()
            })
    
    def analytics_test(self):
        """Test analytics endpoint performance"""
        start_time = time.time()
        try:
            response = requests.get(
                f"{self.base_url}/api/analytics/dashboard",
                timeout=10
            )
            end_time = time.time()
            
            result = {
                "endpoint": "analytics",
                "status_code": response.status_code,
                "response_time": end_time - start_time,
                "timestamp": start_time
            }
            
            if response.status_code == 200:
                self.results.append(result)
            else:
                self.errors.append(result)
                
        except Exception as e:
            self.errors.append({
                "endpoint": "analytics",
                "error": str(e),
                "timestamp": time.time()
            })
    
    def run_load_test(self):
        """Run load test with multiple scenarios"""
        print(f"Starting load test with {self.concurrent_users} concurrent users for {self.duration} seconds")
        
        start_time = time.time()
        end_time = start_time + self.duration
        
        with ThreadPoolExecutor(max_workers=self.concurrent_users) as executor:
            while time.time() < end_time:
                # Submit different test scenarios
                executor.submit(self.login_test)
                executor.submit(self.case_creation_test)
                executor.submit(self.analytics_test)
                
                # Submit photo upload test less frequently due to higher resource usage
                if len(self.results) % 10 == 0:
                    executor.submit(self.photo_upload_test)
                
                time.sleep(0.1)  # Small delay to prevent overwhelming the server
        
        self.generate_report()
    
    def generate_report(self):
        """Generate performance test report"""
        if not self.results:
            print("No successful requests to analyze")
            return
        
        response_times = [r["response_time"] for r in self.results]
        
        report = {
            "test_summary": {
                "total_requests": len(self.results),
                "total_errors": len(self.errors),
                "success_rate": len(self.results) / (len(self.results) + len(self.errors)) * 100,
                "test_duration": self.duration,
                "concurrent_users": self.concurrent_users
            },
            "response_time_stats": {
                "min": min(response_times),
                "max": max(response_times),
                "mean": statistics.mean(response_times),
                "median": statistics.median(response_times),
                "p95": sorted(response_times)[int(len(response_times) * 0.95)],
                "p99": sorted(response_times)[int(len(response_times) * 0.99)]
            },
            "endpoint_performance": {},
            "errors": self.errors
        }
        
        # Group results by endpoint
        for result in self.results:
            endpoint = result["endpoint"]
            if endpoint not in report["endpoint_performance"]:
                report["endpoint_performance"][endpoint] = []
            report["endpoint_performance"][endpoint].append(result["response_time"])
        
        # Calculate stats for each endpoint
        for endpoint, times in report["endpoint_performance"].items():
            report["endpoint_performance"][endpoint] = {
                "count": len(times),
                "avg_response_time": statistics.mean(times),
                "max_response_time": max(times),
                "min_response_time": min(times)
            }
        
        # Save report
        with open("performance-test-report.json", "w") as f:
            json.dump(report, f, indent=2)
        
        # Print summary
        print("\n" + "="*50)
        print("PERFORMANCE TEST RESULTS")
        print("="*50)
        print(f"Total Requests: {report['test_summary']['total_requests']}")
        print(f"Total Errors: {report['test_summary']['total_errors']}")
        print(f"Success Rate: {report['test_summary']['success_rate']:.2f}%")
        print(f"Average Response Time: {report['response_time_stats']['mean']:.3f}s")
        print(f"95th Percentile: {report['response_time_stats']['p95']:.3f}s")
        print(f"99th Percentile: {report['response_time_stats']['p99']:.3f}s")
        print("\nEndpoint Performance:")
        for endpoint, stats in report["endpoint_performance"].items():
            print(f"  {endpoint}: {stats['avg_response_time']:.3f}s avg ({stats['count']} requests)")
        print("="*50)

if __name__ == "__main__":
    import sys
    base_url = sys.argv[1] if len(sys.argv) > 1 else "https://$Domain"
    concurrent_users = int(sys.argv[2]) if len(sys.argv) > 2 else $ConcurrentUsers
    duration = int(sys.argv[3]) if len(sys.argv) > 3 else $TestDuration
    
    test = PerformanceTest(base_url, concurrent_users, duration)
    test.run_load_test()
"@

$LoginTestScript | Out-File -FilePath "performance/load-test.py" -Encoding UTF8

# Create JMeter test plan
$JMeterTestPlan = @"
<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2" properties="5.0" jmeter="5.4.1">
  <hashTree>
    <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="Waste Management Performance Test" enabled="true">
      <stringProp name="TestPlan.comments">Performance test for Waste Management System</stringProp>
      <boolProp name="TestPlan.functional_mode">false</boolProp>
      <boolProp name="TestPlan.tearDown_on_shutdown">true</boolProp>
      <boolProp name="TestPlan.serialize_threadgroups">false</boolProp>
      <elementProp name="TestPlan.arguments" elementType="Arguments" guiclass="ArgumentsPanel" testclass="Arguments" testname="User Defined Variables" enabled="true">
        <collectionProp name="Arguments.arguments">
          <elementProp name="base_url" elementType="Argument">
            <stringProp name="Argument.name">base_url</stringProp>
            <stringProp name="Argument.value">https://$Domain</stringProp>
            <stringProp name="Argument.metadata">=</stringProp>
          </elementProp>
        </collectionProp>
      </elementProp>
      <stringProp name="TestPlan.user_define_classpath"></stringProp>
    </TestPlan>
    <hashTree>
      <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="Load Test Thread Group" enabled="true">
        <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
        <elementProp name="ThreadGroup.main_controller" elementType="LoopController" guiclass="LoopControllerGui" testclass="LoopController" testname="Loop Controller" enabled="true">
          <boolProp name="LoopController.continue_forever">false</boolProp>
          <stringProp name="LoopController.loops">-1</stringProp>
        </elementProp>
        <stringProp name="ThreadGroup.num_threads">$ConcurrentUsers</stringProp>
        <stringProp name="ThreadGroup.ramp_time">60</stringProp>
        <boolProp name="ThreadGroup.scheduler">true</boolProp>
        <stringProp name="ThreadGroup.duration">$TestDuration</stringProp>
        <stringProp name="ThreadGroup.delay"></stringProp>
        <boolProp name="ThreadGroup.same_user_on_next_iteration">true</boolProp>
      </ThreadGroup>
      <hashTree>
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="Login Request" enabled="true">
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments" testname="User Defined Variables" enabled="true">
            <collectionProp name="Arguments.arguments"/>
          </elementProp>
          <stringProp name="HTTPSampler.domain">$Domain</stringProp>
          <stringProp name="HTTPSampler.port">443</stringProp>
          <stringProp name="HTTPSampler.protocol">https</stringProp>
          <stringProp name="HTTPSampler.contentEncoding"></stringProp>
          <stringProp name="HTTPSampler.path">/api/auth/login</stringProp>
          <stringProp name="HTTPSampler.method">POST</stringProp>
          <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
          <boolProp name="HTTPSampler.auto_redirects">false</boolProp>
          <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
          <boolProp name="HTTPSampler.DO_MULTIPART_POST">false</boolProp>
          <stringProp name="HTTPSampler.embedded_url_re"></stringProp>
          <stringProp name="HTTPSampler.connect_timeout"></stringProp>
          <stringProp name="HTTPSampler.response_timeout"></stringProp>
        </HTTPSamplerProxy>
        <hashTree>
          <HeaderManager guiclass="HeaderPanel" testclass="HeaderManager" testname="HTTP Header Manager" enabled="true">
            <collectionProp name="HeaderManager.headers">
              <elementProp name="" elementType="Header">
                <stringProp name="Header.name">Content-Type</stringProp>
                <stringProp name="Header.value">application/json</stringProp>
              </elementProp>
            </collectionProp>
          </HeaderManager>
          <hashTree/>
          <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="Create Case Request" enabled="true">
            <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments" testname="User Defined Variables" enabled="true">
              <collectionProp name="Arguments.arguments"/>
            </elementProp>
            <stringProp name="HTTPSampler.domain">$Domain</stringProp>
            <stringProp name="HTTPSampler.port">443</stringProp>
            <stringProp name="HTTPSampler.protocol">https</stringProp>
            <stringProp name="HTTPSampler.contentEncoding"></stringProp>
            <stringProp name="HTTPSampler.path">/api/cases</stringProp>
            <stringProp name="HTTPSampler.method">POST</stringProp>
            <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
            <boolProp name="HTTPSampler.auto_redirects">false</boolProp>
            <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
            <boolProp name="HTTPSampler.DO_MULTIPART_POST">false</boolProp>
            <stringProp name="HTTPSampler.embedded_url_re"></stringProp>
            <stringProp name="HTTPSampler.connect_timeout"></stringProp>
            <stringProp name="HTTPSampler.response_timeout"></stringProp>
          </HTTPSamplerProxy>
          <hashTree/>
          <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="Analytics Request" enabled="true">
            <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments" testname="User Defined Variables" enabled="true">
              <collectionProp name="Arguments.arguments"/>
            </elementProp>
            <stringProp name="HTTPSampler.domain">$Domain</stringProp>
            <stringProp name="HTTPSampler.port">443</stringProp>
            <stringProp name="HTTPSampler.protocol">https</stringProp>
            <stringProp name="HTTPSampler.contentEncoding"></stringProp>
            <stringProp name="HTTPSampler.path">/api/analytics/dashboard</stringProp>
            <stringProp name="HTTPSampler.method">GET</stringProp>
            <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
            <boolProp name="HTTPSampler.auto_redirects">false</boolProp>
            <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
            <boolProp name="HTTPSampler.DO_MULTIPART_POST">false</boolProp>
            <stringProp name="HTTPSampler.embedded_url_re"></stringProp>
            <stringProp name="HTTPSampler.connect_timeout"></stringProp>
            <stringProp name="HTTPSampler.response_timeout"></stringProp>
          </HTTPSamplerProxy>
          <hashTree/>
        </hashTree>
      </hashTree>
      <ResultCollector guiclass="SummaryReport" testclass="ResultCollector" testname="Summary Report" enabled="true">
        <boolProp name="ResultCollector.error_logging">false</boolProp>
        <objProp>
          <name>saveConfig</name>
          <value class="SampleSaveConfiguration">
            <time>true</time>
            <latency>true</latency>
            <timestamp>true</timestamp>
            <success>true</success>
            <label>true</label>
            <code>true</code>
            <message>true</message>
            <threadName>true</threadName>
            <dataType>true</dataType>
            <encoding>false</encoding>
            <assertions>true</assertions>
            <subresults>true</subresults>
            <responseData>false</responseData>
            <samplerData>false</samplerData>
            <xml>false</xml>
            <fieldNames>true</fieldNames>
            <responseHeaders>false</responseHeaders>
            <requestHeaders>false</requestHeaders>
            <responseDataOnError>false</responseDataOnError>
            <saveAssertionResultsFailureMessage>true</saveAssertionResultsFailureMessage>
            <assertionsResultsToSave>0</assertionsResultsToSave>
            <bytes>true</bytes>
            <sentBytes>true</sentBytes>
            <url>true</url>
            <threadCounts>true</threadCounts>
            <idleTime>true</idleTime>
            <connectTime>true</connectTime>
          </value>
        </objProp>
        <stringProp name="filename">performance-test-results.jtl</stringProp>
      </ResultCollector>
      <hashTree/>
    </hashTree>
  </hashTree>
</jmeterTestPlan>
"@

$JMeterTestPlan | Out-File -FilePath "performance/jmeter-test-plan.jmx" -Encoding UTF8

# Create performance monitoring script
$PerformanceMonitoringScript = @"
#!/bin/bash
# Performance Monitoring Script

echo "📊 Starting performance monitoring..."

# Monitor system resources
echo "💻 Monitoring system resources..."
top -bn1 | head -20 > system-resources.txt

# Monitor database performance
echo "🗄️  Monitoring database performance..."
psql -h $Domain -U postgres -d waste_management -c "
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;
" > database-performance.txt

# Monitor Redis performance
echo "🔴 Monitoring Redis performance..."
redis-cli -h $Domain -p 6379 info stats > redis-performance.txt

# Monitor application metrics
echo "📈 Monitoring application metrics..."
curl -s https://$Domain/api/metrics > application-metrics.txt

# Monitor response times
echo "⏱️  Monitoring response times..."
for endpoint in "/api/health" "/api/cases" "/api/analytics/dashboard"; do
    echo "Testing $endpoint..."
    time curl -s -o /dev/null https://$Domain$endpoint
done > response-times.txt

echo "✅ Performance monitoring completed"
echo "📋 Results saved to:"
echo "  - system-resources.txt"
echo "  - database-performance.txt"
echo "  - redis-performance.txt"
echo "  - application-metrics.txt"
echo "  - response-times.txt"
"@

$PerformanceMonitoringScript | Out-File -FilePath "performance/monitor-performance.sh" -Encoding UTF8

# Create performance optimization recommendations
$PerformanceRecommendations = @"
# Performance Optimization Recommendations

## Database Optimization
1. **Index Optimization**
   - Add indexes on frequently queried columns
   - Use composite indexes for multi-column queries
   - Monitor index usage and remove unused indexes

2. **Query Optimization**
   - Use EXPLAIN ANALYZE to identify slow queries
   - Optimize JOIN operations
   - Use appropriate data types
   - Implement query result caching

3. **Connection Pooling**
   - Configure connection pool size based on load
   - Use connection pooling libraries
   - Monitor connection usage

## Application Optimization
1. **Caching Strategy**
   - Implement Redis caching for frequently accessed data
   - Use application-level caching
   - Cache API responses where appropriate

2. **Code Optimization**
   - Optimize database queries
   - Use async/await for I/O operations
   - Implement lazy loading
   - Optimize image processing

3. **API Optimization**
   - Implement pagination for large datasets
   - Use compression for API responses
   - Implement rate limiting
   - Use CDN for static assets

## Infrastructure Optimization
1. **Auto Scaling**
   - Configure auto scaling based on CPU/memory usage
   - Use horizontal pod autoscaling
   - Implement load balancing

2. **Resource Allocation**
   - Right-size instances based on actual usage
   - Use spot instances for non-critical workloads
   - Implement resource quotas

3. **Monitoring and Alerting**
   - Set up performance monitoring
   - Configure alerts for performance degradation
   - Implement automated scaling triggers

## Performance Targets
- **Response Time**: < 200ms for 95% of requests
- **Throughput**: > 1000 requests per second
- **Availability**: 99.9% uptime
- **Error Rate**: < 0.1%

## Testing Strategy
1. **Load Testing**: Test with expected peak load
2. **Stress Testing**: Test beyond expected capacity
3. **Spike Testing**: Test sudden traffic spikes
4. **Volume Testing**: Test with large data volumes
5. **Endurance Testing**: Test for extended periods

## Monitoring KPIs
- Average response time
- 95th percentile response time
- Request throughput
- Error rate
- CPU utilization
- Memory utilization
- Database connection pool usage
- Cache hit ratio
"@

$PerformanceRecommendations | Out-File -FilePath "performance/optimization-recommendations.md" -Encoding UTF8

Write-Host "🎉 Performance testing setup completed!" -ForegroundColor Blue
Write-Host "🐍 Python load test script: performance/load-test.py" -ForegroundColor Green
Write-Host "📊 JMeter test plan: performance/jmeter-test-plan.jmx" -ForegroundColor Green
Write-Host "📈 Performance monitoring: performance/monitor-performance.sh" -ForegroundColor Green
Write-Host "📋 Optimization recommendations: performance/optimization-recommendations.md" -ForegroundColor Green

Write-Host "🚀 To run performance tests:" -ForegroundColor Yellow
Write-Host "  python performance/load-test.py https://$Domain $ConcurrentUsers $TestDuration" -ForegroundColor Yellow
Write-Host "  jmeter -n -t performance/jmeter-test-plan.jmx -l performance-results.jtl" -ForegroundColor Yellow
