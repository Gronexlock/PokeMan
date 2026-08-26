/**
 * Test Runner Framework ligero y desacoplado para TypeScript.
 * Proporciona sintaxis describe / it / expect compatible y reporte visual.
 */

export interface TestResult {
  suiteName: string;
  testName: string;
  passed: boolean;
  error?: Error;
  durationMs: number;
}

export interface SuiteStats {
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  results: TestResult[];
}

let currentSuiteName = 'Default Suite';
let beforeEachCallbacks: (() => void | Promise<void>)[] = [];
const registeredSuites: { name: string; fn: () => void | Promise<void> }[] = [];
const testResults: TestResult[] = [];

export function describe(name: string, fn: () => void | Promise<void>): void {
  registeredSuites.push({ name, fn });
}

export function beforeEach(fn: () => void | Promise<void>): void {
  beforeEachCallbacks.push(fn);
}

export function it(name: string, fn: () => void | Promise<void>): void {
  const startTime = performance.now();
  try {
    for (const hook of beforeEachCallbacks) {
      hook();
    }
    const res = fn();
    if (res instanceof Promise) {
      throw new Error(`Prueba asíncrona '${name}' detectada. Utilice itAsync.`);
    }
    const durationMs = performance.now() - startTime;
    testResults.push({
      suiteName: currentSuiteName,
      testName: name,
      passed: true,
      durationMs
    });
  } catch (err: any) {
    const durationMs = performance.now() - startTime;
    testResults.push({
      suiteName: currentSuiteName,
      testName: name,
      passed: false,
      error: err instanceof Error ? err : new Error(String(err)),
      durationMs
    });
  }
}

export async function itAsync(name: string, fn: () => Promise<void>): Promise<void> {
  const startTime = performance.now();
  try {
    for (const hook of beforeEachCallbacks) {
      await hook();
    }
    await fn();
    const durationMs = performance.now() - startTime;
    testResults.push({
      suiteName: currentSuiteName,
      testName: name,
      passed: true,
      durationMs
    });
  } catch (err: any) {
    const durationMs = performance.now() - startTime;
    testResults.push({
      suiteName: currentSuiteName,
      testName: name,
      passed: false,
      error: err instanceof Error ? err : new Error(String(err)),
      durationMs
    });
  }
}

class Expectation<T> {
  constructor(private actual: T, private isNot: boolean = false) {}

  get not(): Expectation<T> {
    return new Expectation(this.actual, !this.isNot);
  }

  public toBe(expected: any): void {
    const pass = Object.is(this.actual, expected);
    this.assert(pass, `Se esperaba ${JSON.stringify(expected)} pero se obtuvo ${JSON.stringify(this.actual)}`);
  }

  public toEqual(expected: any): void {
    const pass = JSON.stringify(this.actual) === JSON.stringify(expected);
    this.assert(pass, `Se esperaba que fuese igual a ${JSON.stringify(expected)} pero se obtuvo ${JSON.stringify(this.actual)}`);
  }

  public toBeTruthy(): void {
    const pass = Boolean(this.actual);
    this.assert(pass, `Se esperaba un valor truthy pero se obtuvo ${JSON.stringify(this.actual)}`);
  }

  public toBeFalsy(): void {
    const pass = !Boolean(this.actual);
    this.assert(pass, `Se esperaba un valor falsy pero se obtuvo ${JSON.stringify(this.actual)}`);
  }

  public toBeNull(): void {
    const pass = this.actual === null;
    this.assert(pass, `Se esperaba null pero se obtuvo ${JSON.stringify(this.actual)}`);
  }

  public toBeUndefined(): void {
    const pass = this.actual === undefined;
    this.assert(pass, `Se esperaba undefined pero se obtuvo ${JSON.stringify(this.actual)}`);
  }

  public toBeDefined(): void {
    const pass = this.actual !== undefined;
    this.assert(pass, `Se esperaba un valor definido pero fue undefined`);
  }

  public toBeGreaterThan(expected: number): void {
    const pass = (this.actual as any) > expected;
    this.assert(pass, `Se esperaba que ${this.actual} fuera mayor que ${expected}`);
  }

  public toBeGreaterThanOrEqual(expected: number): void {
    const pass = (this.actual as any) >= expected;
    this.assert(pass, `Se esperaba que ${this.actual} fuera mayor o igual que ${expected}`);
  }

  public toBeLessThan(expected: number): void {
    const pass = (this.actual as any) < expected;
    this.assert(pass, `Se esperaba que ${this.actual} fuera menor que ${expected}`);
  }

  public toBeLessThanOrEqual(expected: number): void {
    const pass = (this.actual as any) <= expected;
    this.assert(pass, `Se esperaba que ${this.actual} fuera menor o igual que ${expected}`);
  }

  public toBeCloseTo(expected: number, delta: number = 0.01): void {
    const pass = Math.abs((this.actual as any) - expected) <= delta;
    this.assert(pass, `Se esperaba que ${this.actual} estuviera cerca de ${expected} (±${delta})`);
  }

  public toContain(item: any): void {
    let pass = false;
    if (Array.isArray(this.actual)) {
      pass = this.actual.includes(item);
    } else if (typeof this.actual === 'string') {
      pass = this.actual.includes(String(item));
    }
    this.assert(pass, `Se esperaba que contuviera ${JSON.stringify(item)}`);
  }

  public toHaveLength(expectedLength: number): void {
    const len = (this.actual as any)?.length;
    const pass = len === expectedLength;
    this.assert(pass, `Se esperaba una longitud de ${expectedLength} pero fue ${len}`);
  }

  public toThrow(): void {
    let threw = false;
    if (typeof this.actual === 'function') {
      try {
        (this.actual as any)();
      } catch (e) {
        threw = true;
      }
    }
    this.assert(threw, `Se esperaba que la función lanzara un error, pero no lo hizo.`);
  }

  private assert(condition: boolean, defaultMessage: string): void {
    const finalCondition = this.isNot ? !condition : condition;
    if (!finalCondition) {
      throw new Error(this.isNot ? `[NOT] ${defaultMessage}` : defaultMessage);
    }
  }
}

export function expect<T>(actual: T): Expectation<T> {
  return new Expectation(actual);
}

/**
 * Ejecuta todas las suites registradas y produce un resumen.
 */
export async function runAllSuites(): Promise<SuiteStats> {
  testResults.length = 0;
  const suiteStartTime = performance.now();

  for (const suite of registeredSuites) {
    currentSuiteName = suite.name;
    beforeEachCallbacks = [];
    await suite.fn();
  }

  const totalDuration = performance.now() - suiteStartTime;
  const passed = testResults.filter(t => t.passed).length;
  const failed = testResults.filter(t => !t.passed).length;

  const stats: SuiteStats = {
    total: testResults.length,
    passed,
    failed,
    durationMs: totalDuration,
    results: testResults
  };

  printReport(stats);
  return stats;
}

function printReport(stats: SuiteStats): void {
  console.log('\n===============================================================');
  console.log('🧪 POKÉMON: ECOS DE ANDARA — REPORTE DE PRUEBAS UNITARIAS');
  console.log('===============================================================');

  const grouped: Record<string, TestResult[]> = {};
  for (const r of stats.results) {
    if (!grouped[r.suiteName]) grouped[r.suiteName] = [];
    grouped[r.suiteName].push(r);
  }

  for (const [suite, tests] of Object.entries(grouped)) {
    console.log(`\n📦 Suite: ${suite}`);
    for (const t of tests) {
      if (t.passed) {
        console.log(`  ✅ PASS: ${t.testName} (${t.durationMs.toFixed(2)}ms)`);
      } else {
        console.error(`  ❌ FAIL: ${t.testName} (${t.durationMs.toFixed(2)}ms)`);
        console.error(`     Error: ${t.error?.message}`);
      }
    }
  }

  console.log('\n---------------------------------------------------------------');
  console.log(`Resumen: ${stats.passed} aprobadas / ${stats.failed} fallidas (Total: ${stats.total})`);
  console.log(`Tiempo total: ${stats.durationMs.toFixed(2)}ms`);
  console.log('===============================================================\n');
}
