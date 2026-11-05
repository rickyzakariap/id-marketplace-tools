# Rules - ID Marketplace Tools

## Coding Standards

### General

1. **Language:** English untuk code & comments, Bahasa Indonesia untuk user-facing text
2. **Line length:** Max 100 characters
3. **Indentation:** 2 spaces (JS/TS/CSS), 1 tab (Go)
4. **Naming:** camelCase (JS), PascalCase (Go exported), snake_case (DB columns)
5. **No abbreviations:** `calculate` bukan `calc`, `description` bukan `desc`

### Go (CLI Tools)

```go
// ✅ Good
func CalculateFee(price float64) float64 {
    return price * 0.05
}

// ❌ Bad
func CalcFee(p float64) float64 {
    return p * 0.05
}
```

**Rules:**
- Stdlib only - no external dependencies kecuali absolutely necessary
- Error handling: Always check errors, wrap dengan context
- Concurrency: Goroutines + channels, avoid shared state
- Testing: Table-driven tests, coverage > 80%

### JavaScript (Web Tools)

```javascript
// ✅ Good
function calculateTotalFee(price, marketplace) {
  return price * getFeeRate(marketplace);
}

// ❌ Bad
const calc = (p, m) => p * getFeeRate(m);
```

**Rules:**
- Node.js 22 + Express 4, vanilla HTML/CSS/JS in `public/`
- No React, Vite, Next.js, Tailwind, or bundler for new tools
- Async/await over `.then()` chains
- Validate every request body and return 400/413 for bad input

### CSS

```css
/* ✅ Good */
.product-card {
  background: var(--surface);
  border-radius: 0.5rem;
  padding: 1.5rem;
}

/* ❌ Bad */
.card {
  background: white;
  border-radius: 8px;
  padding: 24px;
}
```

**Rules:**
- BEM naming: `.block__element--modifier`
- CSS variables untuk colors, spacing, typography
- Mobile-first responsive design
- No `!important` kecuali override third-party

## Git Workflow

### Branch Naming

```
feature/10-bulk-fee-calculator
fix/20-price-optimizer-crash
docs/update-readme
refactor/shared-utils
```

### Commit Messages

```
feat(fee-calculator): add parallel processing

- Use goroutines untuk calculate fees concurrently
- Reduce processing time from 5s to 0.5s for 1000 products
- Add benchmark tests

Fixes #12
```

**Format:** `<type>(<scope>): <subject>`

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting, no code change
- `refactor` - Code restructuring
- `test` - Add/update tests
- `chore` - Maintenance

### Pull Requests

**Title:** Same as commit message format

**Body:**
```markdown
## What
Brief description of changes

## Why
Problem being solved

## How
Technical approach

## Testing
- [ ] Unit tests pass
- [ ] Manual testing done
- [ ] Edge cases covered

## Screenshots
(if UI changes)
```

**Rules:**
- 1 approval required
- All CI checks pass
- No merge conflicts
- Squash & merge

## Testing

### Unit Tests

```go
// Go example
func TestCalculateFee(t *testing.T) {
    tests := []struct {
        name     string
        price    float64
        expected float64
    }{
        {"normal price", 100000, 5000},
        {"zero price", 0, 0},
        {"negative price", -100000, 0}, // edge case
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result := CalculateFee(tt.price)
            if result != tt.expected {
                t.Errorf("got %v, want %v", result, tt.expected)
            }
        })
    }
}
```

**Rules:**
- Test file: `*_test.go` (Go), `*.test.js` (Node), `test_*.py` (Python)
- Arrange-Act-Assert pattern
- Test edge cases: zero, negative, max values
- Mock external dependencies

### Integration Tests

```javascript
// Node example with node:test
const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../server');

test('calculate API returns results', async () => {
  const server = app.listen(0);
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/calculate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ products: [{ name: 'Test', price: 100000 }] }),
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.results.length, 6);
  server.close();
});
```

**Rules:**
- Test full user flows
- Use test database (separate from dev)
- Cleanup after tests

## Security

### Secrets Management

```bash
# ✅ Good - Environment variables
MARKETPLACE_API_KEY=${MARKETPLACE_API_KEY}

# ❌ Bad - Hardcoded
const apiKey = "sk-1234567890";
```

**Rules:**
- No API keys in code - use `.env` files
- `.env` in `.gitignore`
- Rotate secrets quarterly
- Use secrets manager untuk production

### Input Validation

```javascript
// ✅ Good - Validate everything
function validatePrice(price) {
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
    throw new Error('Invalid price');
  }
  return price;
}

// ❌ Bad - Trust user input
const price = req.body.price; // could be anything
```

**Rules:**
- Validate all user inputs
- Sanitize strings (prevent XSS)
- Use parameterized queries (prevent SQL injection)
- Rate limit API endpoints

### Dependencies

```bash
# Check for vulnerabilities
npm audit
go list -m all
```

**Rules:**
- Update dependencies monthly
- Use `npm audit` / `go vet`
- Pin versions (no `^` or `~` di production)

## Documentation

### Code Comments

```go
// ✅ Good - Explain WHY, not WHAT
// Use goroutines karena kita process 1000+ products
// dan mau reduce latency dari 5s ke <1s
for _, product := range products {
    go calculateFee(product)
}

// ❌ Bad - Obvious comments
// Loop through products
for _, product := range products {
    // ...
}
```

**Rules:**
- Comment complex logic
- Document public APIs
- Include examples in docstrings
- Keep comments up-to-date

### README

Every tool must have:
1. **What it does** - 1 sentence
2. **Installation** - How to install
3. **Usage** - Examples dengan output
4. **Configuration** - Env vars, config files
5. **Contributing** - How to contribute
6. **License** - MIT

## Performance

### CLI Tools

```go
// ✅ Good - Parallel processing
var wg sync.WaitGroup
for _, product := range products {
    wg.Add(1)
    go func(p Product) {
        defer wg.Done()
        process(p)
    }(product)
}
wg.Wait()

// ❌ Bad - Sequential
for _, product := range products {
    process(product) // slow for 1000+ items
}
```

**Rules:**
- Benchmark critical paths
- Use goroutines untuk I/O-bound tasks
- Cache expensive calculations
- Stream large files (don't load all in memory)

### Web Apps

```javascript
// ✅ Good - Cache expensive work and batch DOM writes
let cachedInput = '';
let cachedResult = null;

function calculateOnce(input) {
  if (input !== cachedInput) {
    cachedInput = input;
    cachedResult = calculateFees(input);
  }
  return cachedResult;
}

// ❌ Bad - Recalculate on every input event
document.querySelector('#price').addEventListener('input', (event) => {
  render(calculateFees(event.target.value)); // slow!
});
```

**Rules:**
- Debounce expensive input handlers
- Cache DOM references instead of re-querying
- Batch DOM writes and avoid layout thrashing
- Optimize images (WebP, lazy load)

## Error Handling

### CLI Tools

```go
// ✅ Good - Wrap errors dengan context
products, err := csvhandler.Parse(input)
if err != nil {
    return fmt.Errorf("failed to parse CSV %s: %w", input, err)
}

// ❌ Bad - Generic error
if err != nil {
    return err
}
```

**Rules:**
- Wrap errors dengan context
- Use sentinel errors untuk known cases
- Log errors dengan stack trace
- User-friendly error messages

### Web Apps

```javascript
// ✅ Good - Specific error handling
try {
  const result = await calculateFees(products);
  return result;
} catch (error) {
  if (error instanceof ValidationError) {
    return { error: 'Invalid input', details: error.details };
  }
  if (error instanceof NetworkError) {
    return { error: 'Network error, please retry' };
  }
  throw error; // unknown error
}

// ❌ Bad - Catch everything
try {
  // ...
} catch (e) {
  console.log(e); // lost context
}
```

## Deployment

### CLI Tools

```bash
# Build untuk all platforms
go build -o bin/fee-calculator-linux ./cmd/fee-calculator
go build -o bin/fee-calculator-windows.exe ./cmd/fee-calculator
go build -o bin/fee-calculator-darwin ./cmd/fee-calculator

# Upload ke GitHub Releases
gh release create v1.0.0 bin/*
```

**Rules:**
- Cross-compile untuk Linux, Windows, macOS
- Semantic versioning (v1.0.0)
- Include changelog di release notes

### Web Apps

```bash
# Run locally
npm start

# Deploy the Node process (Railway/Fly/VPS)
node server.js
```

**Rules:**
- Environment variables di dashboard host
- Health check endpoint for the process
- Monitor errors and restart on failure

## Monitoring

### Metrics to Track

- **CLI:** Download count, error rate
- **Web:** Page views, conversion rate, error rate
- **API:** Response time, error rate, usage

### Alerts

- Error rate > 1%
- Response time > 2s
- API quota > 80%

## Do's and Don'ts

### ✅ Do

- Write tests before merging
- Document public APIs
- Keep dependencies minimal
- Validate all inputs
- Handle errors gracefully
- Keep commits small & focused
- Review code before merging

### ❌ Don't

- Commit `.env` files
- Commit `node_modules`
- Ignore error messages
- Hardcode secrets
- Skip code review
- Merge without tests
- Use `!important` di CSS