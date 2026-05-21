# Smart Todo API Test Script
# Using PowerShell and Invoke-RestMethod

$BaseUrl = "http://localhost:3000/api"
$Token = $null
$TestTodoId = $null

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Smart Todo API Auto Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test counters
$TotalTests = 0
$PassedTests = 0
$FailedTests = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Endpoint,
        [hashtable]$Headers = @{},
        [string]$Body = "",
        [int]$ExpectedStatus = 200
    )

    $TotalTests++
    Write-Host "Test: $Name" -ForegroundColor Yellow
    Write-Host "  $Method $Endpoint" -ForegroundColor Gray

    try {
        $uri = "$BaseUrl$Endpoint"
        $params = @{
            Uri = $uri
            Method = $Method
            ContentType = "application/json"
            ErrorAction = "Stop"
        }

        if ($Headers.Count -gt 0) {
            $params.Headers = $Headers
        }

        if ($Body -ne "") {
            $params.Body = $Body
        }

        $response = Invoke-RestMethod @params
        $statusCode = 200

        if ($statusCode -eq $ExpectedStatus) {
            Write-Host "  [PASS]" -ForegroundColor Green
            $PassedTests++
            return $response
        } else {
            Write-Host "  [FAIL] Status: Expected $ExpectedStatus, Got $statusCode" -ForegroundColor Red
            $FailedTests++
            return $null
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq $ExpectedStatus) {
            Write-Host "  [PASS] (Expected error status)" -ForegroundColor Green
            $PassedTests++
        } else {
            Write-Host "  [FAIL] $_" -ForegroundColor Red
            $FailedTests++
        }
        return $null
    }
    finally {
        Write-Host ""
    }
}

# ============================================
# 1. Auth Tests
# ============================================
Write-Host "[Auth Module]" -ForegroundColor Magenta
Write-Host "----------------------------------------" -ForegroundColor Magenta

# 1.1 Register
$randomNum = Get-Random -Minimum 1000 -Maximum 9999
$testEmail = "testuser$randomNum@example.com"
$registerBody = @{ email = $testEmail; password = "Test123456"; name = "Test User" } | ConvertTo-Json -Compress

$registerResponse = Test-Endpoint -Name "User Register" -Method "POST" -Endpoint "/auth/register" -Body $registerBody -ExpectedStatus 201

# 1.2 Login
$loginBody = @{ email = $testEmail; password = "Test123456" } | ConvertTo-Json -Compress
$loginResponse = Test-Endpoint -Name "User Login" -Method "POST" -Endpoint "/auth/login" -Body $loginBody -ExpectedStatus 200

if ($loginResponse -and $loginResponse.data.token) {
    $Token = $loginResponse.data.token
    Write-Host "  Token: $($Token.Substring(0, 20))..." -ForegroundColor Gray
}

# 1.3 Register with invalid email
$invalidEmailBody = @{ email = "invalid-email"; password = "Test123456" } | ConvertTo-Json -Compress
Test-Endpoint -Name "Register - Invalid Email" -Method "POST" -Endpoint "/auth/register" -Body $invalidEmailBody -ExpectedStatus 400

# 1.4 Register with short password
$shortPasswordBody = @{ email = "new@example.com"; password = "123" } | ConvertTo-Json -Compress
Test-Endpoint -Name "Register - Short Password" -Method "POST" -Endpoint "/auth/register" -Body $shortPasswordBody -ExpectedStatus 400

# 1.4b Register with weak password (no number)
$weakPasswordBody = @{ email = "new@example.com"; password = "TestPassword" } | ConvertTo-Json -Compress
Test-Endpoint -Name "Register - Weak Password (No Number)" -Method "POST" -Endpoint "/auth/register" -Body $weakPasswordBody -ExpectedStatus 400

# 1.4c Register with weak password (no letter)
$weakPasswordBody2 = @{ email = "new@example.com"; password = "12345678" } | ConvertTo-Json -Compress
Test-Endpoint -Name "Register - Short Password" -Method "POST" -Endpoint "/auth/register" -Body $shortPasswordBody -ExpectedStatus 400

# 1.5 Login with wrong password
$wrongPasswordBody = @{ email = $testEmail; password = "WrongPass123" } | ConvertTo-Json -Compress
Test-Endpoint -Name "Login - Wrong Password" -Method "POST" -Endpoint "/auth/login" -Body $wrongPasswordBody -ExpectedStatus 401

# ============================================
# 2. Todo Tests (Need Auth)
# ============================================
if ($Token) {
    Write-Host "[Todo Module]" -ForegroundColor Magenta
    Write-Host "----------------------------------------" -ForegroundColor Magenta

    $authHeaders = @{ "Authorization" = "Bearer $Token" }

    # 2.1 Create Todo
    $createTodoBody = @{
        title = "Complete API Test"
        description = "Write automation test script"
        priority = "high"
        category = "Work"
        dueDate = "2026-05-25"
    } | ConvertTo-Json -Compress

    $createResponse = Test-Endpoint -Name "Create Todo" -Method "POST" -Endpoint "/todos" -Headers $authHeaders -Body $createTodoBody -ExpectedStatus 201

    if ($createResponse -and $createResponse.data.id) {
        $TestTodoId = $createResponse.data.id
    }

    # 2.2 Create Todo (Medium Priority)
    $createTodoBody2 = @{
        title = "Buy groceries"
        description = "Go to supermarket"
        priority = "medium"
        category = "Life"
        dueDate = "2026-05-20"
    } | ConvertTo-Json -Compress
    Test-Endpoint -Name "Create Todo - Medium Priority" -Method "POST" -Endpoint "/todos" -Headers $authHeaders -Body $createTodoBody2 -ExpectedStatus 201

    # 2.3 Create Todo (Low Priority)
    $createTodoBody3 = @{
        title = "Read tech article"
        description = "Learn React features"
        priority = "low"
        category = "Study"
        dueDate = "2026-05-30"
    } | ConvertTo-Json -Compress
    Test-Endpoint -Name "Create Todo - Low Priority" -Method "POST" -Endpoint "/todos" -Headers $authHeaders -Body $createTodoBody3 -ExpectedStatus 201

    # 2.4 Get All Todos (with pagination)
    $todosResponse = Test-Endpoint -Name "Get All Todos (Default Pagination)" -Method "GET" -Endpoint "/todos" -Headers $authHeaders -ExpectedStatus 200

    # 2.4b Get Todos with custom page and limit
    Test-Endpoint -Name "Get Todos - Page 1, Limit 2" -Method "GET" -Endpoint "/todos?page=1&limit=2" -Headers $authHeaders -ExpectedStatus 200

    # 2.4c Get Todos - Second page
    Test-Endpoint -Name "Get Todos - Page 2, Limit 2" -Method "GET" -Endpoint "/todos?page=2&limit=2" -Headers $authHeaders -ExpectedStatus 200

    # 2.5 Filter by Priority
    Test-Endpoint -Name "Filter - High Priority" -Method "GET" -Endpoint "/todos?priority=high" -Headers $authHeaders -ExpectedStatus 200

    # 2.6 Filter by Category
    Test-Endpoint -Name "Filter - Work Category" -Method "GET" -Endpoint "/todos?category=Work" -Headers $authHeaders -ExpectedStatus 200

    # 2.6b Search by keyword
    Test-Endpoint -Name "Search - Keyword in Title" -Method "GET" -Endpoint "/todos?search=API" -Headers $authHeaders -ExpectedStatus 200

    # 2.6c Search by keyword in description
    Test-Endpoint -Name "Search - Keyword in Description" -Method "GET" -Endpoint "/todos?search=supermarket" -Headers $authHeaders -ExpectedStatus 200

    # 2.6d Combined filter and search
    Test-Endpoint -Name "Filter + Search Combined" -Method "GET" -Endpoint "/todos?priority=high&search=Test" -Headers $authHeaders -ExpectedStatus 200

    # 2.7 Update Todo
    if ($TestTodoId) {
        $updateBody = @{ title = "Updated Title"; completed = $true } | ConvertTo-Json -Compress
        Test-Endpoint -Name "Update Todo" -Method "PUT" -Endpoint "/todos/$TestTodoId" -Headers $authHeaders -Body $updateBody -ExpectedStatus 200
    }

    # 2.8 Update Non-existent Todo
    $updateNotExistBody = @{ title = "Non-existent Todo" } | ConvertTo-Json -Compress
    Test-Endpoint -Name "Update Non-existent Todo" -Method "PUT" -Endpoint "/todos/99999" -Headers $authHeaders -Body $updateNotExistBody -ExpectedStatus 404

    # 2.9 Delete Todo
    if ($TestTodoId) {
        Test-Endpoint -Name "Delete Todo" -Method "DELETE" -Endpoint "/todos/$TestTodoId" -Headers $authHeaders -ExpectedStatus 200
    }

    # 2.10 Access Protected Route without Token
    Test-Endpoint -Name "Access Protected - No Token" -Method "GET" -Endpoint "/todos" -ExpectedStatus 401

    # 2.11 Create Todo without Title
    $invalidTodoBody = @{ description = "No title todo" } | ConvertTo-Json -Compress
    Test-Endpoint -Name "Create Todo - Missing Title" -Method "POST" -Endpoint "/todos" -Headers $authHeaders -Body $invalidTodoBody -ExpectedStatus 400

    # ============================================
    # 3. Dashboard Tests
    # ============================================
    Write-Host "[Dashboard Module]" -ForegroundColor Magenta
    Write-Host "----------------------------------------" -ForegroundColor Magenta

    # 3.1 Get Stats
    Test-Endpoint -Name "Get Stats" -Method "GET" -Endpoint "/dashboard/stats" -Headers $authHeaders -ExpectedStatus 200

    # 3.2 Get Trends
    Test-Endpoint -Name "Get Trends" -Method "GET" -Endpoint "/dashboard/trends" -Headers $authHeaders -ExpectedStatus 200

    # 3.3 Get Categories
    Test-Endpoint -Name "Get Categories" -Method "GET" -Endpoint "/dashboard/categories" -Headers $authHeaders -ExpectedStatus 200
}

# ============================================
# Summary
# ============================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total: $TotalTests" -ForegroundColor White
Write-Host "Passed: $PassedTests" -ForegroundColor Green
Write-Host "Failed: $FailedTests" -ForegroundColor Red

$passRate = if ($TotalTests -gt 0) { [math]::Round(($PassedTests / $TotalTests) * 100, 2) } else { 0 }
Write-Host "Pass Rate: $passRate%" -ForegroundColor Yellow
Write-Host ""

if ($FailedTests -eq 0) {
    Write-Host "All tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Some tests failed!" -ForegroundColor Red
    exit 1
}
 