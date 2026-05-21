# Smart Todo API - End-to-End Test Script
# Full flow: Register -> Login -> Create -> Get -> Update -> Delete

$BaseUrl = "http://localhost:3000/api"
$Token = $null
$UserId = $null
$TodoId = $null
$TestEmail = $null

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Smart Todo API - E2E Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Endpoint,
        [hashtable]$Headers = @{},
        [string]$Body = ""
    )

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

    try {
        $response = Invoke-RestMethod @params
        return @{ Success = $true; Data = $response; StatusCode = 200 }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        return @{ Success = $false; Error = $_.Exception.Message; StatusCode = $statusCode }
    }
}

function Test-Step {
    param(
        [int]$Step,
        [string]$Name,
        [scriptblock]$Action
    )

    Write-Host "Step $Step`: $Name" -ForegroundColor Yellow
    Write-Host "  ----------------------------------------" -ForegroundColor Gray

    $result = & $Action

    if ($result -eq $true) {
        Write-Host "  [PASS]" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL]" -ForegroundColor Red
    }
    Write-Host ""
    return $result
}

# ============================================
# Step 1: Register
# ============================================
$step1Result = Test-Step -Step 1 -Name "Register: POST /api/auth/register" -Action {
    $randomNum = Get-Random -Minimum 1000 -Maximum 9999
    $script:TestEmail = "e2euser$randomNum@test.com"

    $body = @{
        email = $script:TestEmail
        password = "TestPass123"
        name = "E2E Test User"
    } | ConvertTo-Json -Compress

    $result = Invoke-ApiRequest -Method "POST" -Endpoint "/auth/register" -Body $body

    if ($result.Success -and $result.Data.success -eq $true) {
        Write-Host "    Email: $($result.Data.data.user.email)" -ForegroundColor Gray
        Write-Host "    UserId: $($result.Data.data.user.id)" -ForegroundColor Gray
        $script:UserId = $result.Data.data.user.id
        return $true
    } else {
        Write-Host "    Error: $($result.Error)" -ForegroundColor Red
        return $false
    }
}

if (-not $step1Result) {
    Write-Host "Register failed, stop test" -ForegroundColor Red
    exit 1
}

# ============================================
# Step 2: Login
# ============================================
$step2Result = Test-Step -Step 2 -Name "Login: POST /api/auth/login" -Action {
    $body = @{
        email = $script:TestEmail
        password = "TestPass123"
    } | ConvertTo-Json -Compress

    $result = Invoke-ApiRequest -Method "POST" -Endpoint "/auth/login" -Body $body

    if ($result.Success -and $result.Data.success -eq $true) {
        $script:Token = $result.Data.data.token
        Write-Host "    Token: $($script:Token.Substring(0, 30))..." -ForegroundColor Gray
        return $true
    } else {
        Write-Host "    Error: $($result.Error)" -ForegroundColor Red
        return $false
    }
}

if (-not $step2Result) {
    Write-Host "Login failed, stop test" -ForegroundColor Red
    exit 1
}

$authHeaders = @{ "Authorization" = "Bearer $($script:Token)" }

# ============================================
# Step 3: Create Todo
# ============================================
$step3Result = Test-Step -Step 3 -Name "Create Todo: POST /api/todos" -Action {
    $body = @{
        title = "E2E Test Todo"
        description = "This is a test todo created by E2E test"
        priority = "high"
        category = "Test"
        dueDate = "2026-12-31"
    } | ConvertTo-Json -Compress

    $result = Invoke-ApiRequest -Method "POST" -Endpoint "/todos" -Headers $authHeaders -Body $body

    if ($result.Success -and $result.Data.success -eq $true) {
        $script:TodoId = $result.Data.data.id
        Write-Host "    TodoId: $($script:TodoId)" -ForegroundColor Gray
        Write-Host "    Title: $($result.Data.data.title)" -ForegroundColor Gray
        Write-Host "    Priority: $($result.Data.data.priority)" -ForegroundColor Gray
        return $true
    } else {
        Write-Host "    Error: $($result.Error)" -ForegroundColor Red
        return $false
    }
}

if (-not $step3Result) {
    Write-Host "Create todo failed, stop test" -ForegroundColor Red
    exit 1
}

# ============================================
# Step 4: Get List (verify contains created todo)
# ============================================
$step4Result = Test-Step -Step 4 -Name "Get List: GET /api/todos" -Action {
    $result = Invoke-ApiRequest -Method "GET" -Endpoint "/todos" -Headers $authHeaders

    if ($result.Success -and $result.Data.success -eq $true) {
        $todos = $result.Data.data.list
        $pagination = $result.Data.data.pagination

        Write-Host "    Total: $($pagination.total)" -ForegroundColor Gray
        Write-Host "    Page: $($pagination.page)" -ForegroundColor Gray
        Write-Host "    Limit: $($pagination.limit)" -ForegroundColor Gray
        Write-Host "    TotalPages: $($pagination.totalPages)" -ForegroundColor Gray

        # Verify contains created todo
        $foundTodo = $todos | Where-Object { $_.id -eq $script:TodoId }
        if ($foundTodo) {
            Write-Host "    [OK] Found created todo: $($foundTodo.title)" -ForegroundColor Green
            return $true
        } else {
            Write-Host "    [FAIL] Created todo not found" -ForegroundColor Red
            return $false
        }
    } else {
        Write-Host "    Error: $($result.Error)" -ForegroundColor Red
        return $false
    }
}

# ============================================
# Step 5: Update Todo
# ============================================
$step5Result = Test-Step -Step 5 -Name "Update Todo: PUT /api/todos/$($script:TodoId)" -Action {
    $body = @{
        title = "Updated E2E Test Todo"
        description = "This todo has been updated"
        completed = $true
        priority = "medium"
    } | ConvertTo-Json -Compress

    $result = Invoke-ApiRequest -Method "PUT" -Endpoint "/todos/$($script:TodoId)" -Headers $authHeaders -Body $body

    if ($result.Success -and $result.Data.success -eq $true) {
        Write-Host "    Title: $($result.Data.data.title)" -ForegroundColor Gray
        Write-Host "    Completed: $($result.Data.data.completed)" -ForegroundColor Gray
        Write-Host "    Priority: $($result.Data.data.priority)" -ForegroundColor Gray

        # Verify update success
        if ($result.Data.data.title -eq "Updated E2E Test Todo" -and
            $result.Data.data.completed -eq $true -and
            $result.Data.data.priority -eq "medium") {
            Write-Host "    [OK] Update verified" -ForegroundColor Green
            return $true
        } else {
            Write-Host "    [FAIL] Update data mismatch" -ForegroundColor Red
            return $false
        }
    } else {
        Write-Host "    Error: $($result.Error)" -ForegroundColor Red
        return $false
    }
}

# ============================================
# Step 6: Delete Todo
# ============================================
$step6Result = Test-Step -Step 6 -Name "Delete Todo: DELETE /api/todos/$($script:TodoId)" -Action {
    $result = Invoke-ApiRequest -Method "DELETE" -Endpoint "/todos/$($script:TodoId)" -Headers $authHeaders

    if ($result.Success -and $result.Data.success -eq $true) {
        Write-Host "    Message: $($result.Data.message)" -ForegroundColor Gray
        return $true
    } else {
        Write-Host "    Error: $($result.Error)" -ForegroundColor Red
        return $false
    }
}

# ============================================
# Step 7: Confirm Delete (get list again to verify)
# ============================================
$step7Result = Test-Step -Step 7 -Name "Confirm Delete: GET /api/todos" -Action {
    $result = Invoke-ApiRequest -Method "GET" -Endpoint "/todos" -Headers $authHeaders

    if ($result.Success -and $result.Data.success -eq $true) {
        $todos = $result.Data.data.list

        # Verify todo has been deleted
        $foundTodo = $todos | Where-Object { $_.id -eq $script:TodoId }
        if (-not $foundTodo) {
            Write-Host "    [OK] Todo successfully deleted" -ForegroundColor Green
            return $true
        } else {
            Write-Host "    [FAIL] Todo still exists" -ForegroundColor Red
            return $false
        }
    } else {
        Write-Host "    Error: $($result.Error)" -ForegroundColor Red
        return $false
    }
}

# ============================================
# Test Summary
# ============================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  E2E Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$passed = 0
$failed = 0

if ($step1Result) { $passed++ } else { $failed++ }
if ($step2Result) { $passed++ } else { $failed++ }
if ($step3Result) { $passed++ } else { $failed++ }
if ($step4Result) { $passed++ } else { $failed++ }
if ($step5Result) { $passed++ } else { $failed++ }
if ($step6Result) { $passed++ } else { $failed++ }
if ($step7Result) { $passed++ } else { $failed++ }

Write-Host "Total Steps: 7" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red
Write-Host ""

if ($failed -eq 0) {
    Write-Host "All E2E tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Some tests failed" -ForegroundColor Red
    exit 1
}
