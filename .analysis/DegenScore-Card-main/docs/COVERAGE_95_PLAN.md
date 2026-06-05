# Plan para alcanzar 95%+ Code Coverage

## 🎯 Objetivo: 95%+ coverage en todas las categorías

### Áreas típicas de baja cobertura:

#### 1. **Utility Functions (`lib/utils/`)**

- Funciones de formateo
- Validadores
- Helpers
- Transformadores de datos

**Acción:** Crear tests unitarios exhaustivos

#### 2. **API Routes (`pages/api/`)**

- Handlers HTTP
- Autenticación
- Validación de requests
- Error handling

**Acción:** Crear tests de integración con mocks de DB y externos

#### 3. **Hooks personalizados (`hooks/`)**

- useWallet integrations
- useTokenAnalysis
- useDegenCard
- useTokenSecurity

**Acción:** Tests con @testing-library/react-hooks

#### 4. **Services (`lib/services/`)**

- APIs externas (Helius, CoinGecko)
- Database operations
- Caching layers
- Business logic

**Acción:** Tests con mocks comprehensivos

#### 5. **Error Boundaries y Edge Cases**

- Error states
- Loading states
- Empty states
- Network failures

**Acción:** Tests específicos de error handling

### Scripts a crear:

```javascript
// 1. scripts/analyze-coverage.js
// Analiza coverage report y genera lista de archivos con <95%

// 2. scripts/generate-missing-tests.js
// Genera tests para archivos sin coverage

// 3. scripts/add-edge-case-tests.js
// Añade tests de edge cases a archivos existentes
```

### Prioridades:

1. **Alta prioridad (Core Business Logic):**
   - lib/scoring/
   - lib/services/superTokenScorer.ts
   - lib/services/tokenSecurityScanner.ts
   - lib/utils/token-scoring.ts

2. **Media prioridad (API Routes):**
   - pages/api/analyze.ts
   - pages/api/generate-card.ts
   - pages/api/super-token-score.ts

3. **Baja prioridad (UI Components):**
   - Ya tienen buena cobertura con nuestros fixes anteriores

### Comandos útiles:

```bash
# Ver coverage report en browser
npm run test:coverage
open coverage/lcov-report/index.html

# Ver solo archivos con <95% coverage
npx nyc report --reporter=text-summary | grep -v "100.00%"

# Generar coverage badge
npm run generate-badge
```

### Métricas objetivo:

- **Statements:** 95%+
- **Branches:** 90%+
- **Functions:** 95%+
- **Lines:** 95%+

### Next steps:

1. Ejecutar `npm run test:coverage`
2. Analizar reporte de cobertura
3. Identificar archivos con <95%
4. Crear tests específicos para esos archivos
5. Re-ejecutar hasta alcanzar 95%+
