# Rules — ID Marketplace Tools

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
- Stdlib only — no external dependencies kecuali absolutely necessary
- Error handling: Always check errors, wrap dengan context
- Concurrency: Goroutines + channels, avoid shared state
- Testing: Table-driven tests, coverage > 80%

### JavaScript/TypeScript (Web Apps)

```typescript
// ✅ Good
const calculateTotalFee = (price: number, marketplace: string): number => {
  return price * getFeeRate(marketplace);
};

// ❌ Bad
const calc = (p: number, m: string) => p * getFeeRate(m);
```

**Rules:**
- TypeScript strict mode
- Functional components only (React)
- No `any` type — use proper types atau `unknown`
- Async/await over `.then()` chains

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
- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation
- `style` — Formatting, no code change
- `refactor` — Code restructuring
- `test` — Add/update tests
- `chore` — Maintenance

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
- Test file: `*_test.go` (Go), `*.test.ts` (TS)
- Arrange-Act-Assert pattern
- Test edge cases: zero, negative, max values
- Mock external dependencies

### Integration Tests

```typescript
// TypeScript example
describe('Fee Calculator API', () => {
  it('should calculate fees for all marketplaces', async () => {
    const response = await request(app)
      .post('/api/calculate')
      .send({ products: [{ name: 'Test', price: 100000 }] });

    expect(response.status).toBe(200);
    expect(response.body.results).toHaveLength(6);
  });
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
- No API keys in code — use `.env` files
- `.env` in `.gitignore`
- Rotate secrets quarterly
- Use secrets manager untuk production

### Input Validation

```typescript
// ✅ Good - Validate everything
const validatePrice = (price: unknown): number => {
  if (typeof price !== 'number' || price <= 0) {
    throw new Error('Invalid price');
  }
  return price;
};

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
1. **What it does** — 1 sentence
2. **Installation** — How to install
3. **Usage** — Examples dengan output
4. **Configuration** — Env vars, config files
5. **Contributing** — How to contribute
6. **License** — MIT

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

```typescript
// ✅ Good - Memoization
const MemoizedFeeCalculator = React.memo(({ products }) => {
  const fees = useMemo(() => calculateFees(products), [products]);
  return <FeeTable fees={fees} />;
});

// ❌ Bad - Re-calculate on every render
const FeeCalculator = ({ products }) => {
  const fees = calculateFees(products); // slow!
  return <FeeTable fees={fees} />;
};
```

**Rules:**
- Lazy load routes
- Memoize expensive calculations
- Optimize images (WebP, lazy load)
- Minimize bundle size

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

```typescript
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
# Build
npm run build

# Deploy ke Vercel
vercel --prod
```

**Rules:**
- Environment variables di Vercel dashboard
- Preview deployments untuk PRs
- Monitor errors (Sentry)

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
- Use TypeScript strict mode
- Validate all inputs
- Handle errors gracefully
- Keep commits small & focused
- Review code before merging

### ❌ Don't

- Commit `.env` files
- Use `any` type di TypeScript
- Ignore error messages
- Hardcode secrets
- Skip code review
- Merge without tests
- Use `!important` di CSS