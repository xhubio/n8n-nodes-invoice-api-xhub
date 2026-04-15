/**
 * Direct API entitlement tests — proves which endpoints the current API key can access.
 *
 * These tests call the API directly via fetch() (no node code).
 * They serve as evidence for what the node integration tests (integration.test.ts)
 * can and cannot verify with the current API key.
 *
 * Uses cached fixtures from test/fixtures/ for parse tests to avoid
 * burning generate quota unnecessarily.
 *
 * Run with: pnpm test -- test/integration-api.test.ts
 */
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'https://service.invoice-api.xhub.io';
const API_PREFIX = '/api/v1/invoice';

function loadApiKey(): string {
	const envPath = path.resolve(__dirname, '..', '.env.local');
	const content = fs.readFileSync(envPath, 'utf-8');
	const match = content.match(/^API_KEY=(.+)$/m);
	if (!match) throw new Error('API_KEY not found in .env.local');
	return match[1].trim();
}

const API_KEY = loadApiKey();

const invoiceData = JSON.parse(
	fs.readFileSync(path.resolve(__dirname, 'invoice.json'), 'utf-8'),
);

jest.setTimeout(30_000);

async function api(
	method: string,
	endpoint: string,
	body?: Record<string, unknown>,
): Promise<{ status: number; data: Record<string, unknown> }> {
	const opts: RequestInit = {
		method,
		headers: {
			Authorization: `Bearer ${API_KEY}`,
			'Content-Type': 'application/json',
		},
	};
	if (body && method !== 'GET') {
		opts.body = JSON.stringify(body);
	}
	const res = await fetch(`${BASE_URL}${endpoint}`, opts);
	const data = (await res.json()) as Record<string, unknown>;
	return { status: res.status, data };
}

function loadFixture(name: string): string {
	return fs
		.readFileSync(path.resolve(__dirname, 'fixtures', `${name}.b64`), 'utf-8')
		.trim();
}

// ─── Entitlement: Formats ─────────────────────────────────────────────────────

describe('API: Formats', () => {
	it('GET /formats → 200', async () => {
		const { status, data } = await api('GET', `${API_PREFIX}/formats`);
		expect(status).toBe(200);
		expect(Array.isArray(data.countries)).toBe(true);
		expect((data.countries as unknown[]).length).toBeGreaterThanOrEqual(14);
	});

	it('GET /DE/formats → 200', async () => {
		const { status, data } = await api('GET', `${API_PREFIX}/DE/formats`);
		expect(status).toBe(200);
		expect(data.code).toBe('DE');
		expect(data.formats).toContain('xrechnung');
	});
});

// ─── Entitlement: Validate ────────────────────────────────────────────────────

describe('API: Validate', () => {
	it('POST /DE/validate → 200 with valid field', async () => {
		const { status, data } = await api('POST', `${API_PREFIX}/DE/validate`, {
			invoice: invoiceData,
		});
		expect(status).toBe(200);
		expect(typeof data.valid).toBe('boolean');
	});
});

// ─── Entitlement: Generate ────────────────────────────────────────────────────

describe('API: Generate', () => {
	it('POST /DE/pdf/generate → 200 with PDF', async () => {
		const { status, data } = await api('POST', `${API_PREFIX}/DE/pdf/generate`, {
			invoice: invoiceData,
		});

		if (status === 429) {
			expect(data.error).toBe('QUOTA_EXCEEDED');
			return;
		}
		if (status >= 500) {
			console.warn(`Server returned ${status} — skipping assertions. Body:`, data);
			return;
		}

		expect(status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.format).toBe('pdf');
		expect(data.mimeType).toBe('application/pdf');

		const buf = Buffer.from(data.data as string, 'base64');
		expect(buf.subarray(0, 5).toString('ascii')).toBe('%PDF-');
	});

	it('POST /DE/xrechnung/generate → 200 with XML', async () => {
		const { status, data } = await api('POST', `${API_PREFIX}/DE/xrechnung/generate`, {
			invoice: invoiceData,
		});

		if (status === 429) {
			expect(data.error).toBe('QUOTA_EXCEEDED');
			return;
		}
		if (status >= 500) {
			console.warn(`Server returned ${status} — skipping assertions. Body:`, data);
			return;
		}

		expect(status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.format).toBe('xrechnung');

		const xml = Buffer.from(data.data as string, 'base64').toString('utf-8');
		expect(xml).toContain('<?xml');
	});

	it('POST /DE/zugferd/generate → 200 with PDF+XML', async () => {
		const { status, data } = await api('POST', `${API_PREFIX}/DE/zugferd/generate`, {
			invoice: invoiceData,
		});

		if (status === 429) {
			expect(data.error).toBe('QUOTA_EXCEEDED');
			return;
		}
		if (status >= 500) {
			console.warn(`Server returned ${status} — skipping assertions. Body:`, data);
			return;
		}

		expect(status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.format).toBe('zugferd');

		const buf = Buffer.from(data.data as string, 'base64');
		expect(buf.subarray(0, 5).toString('ascii')).toBe('%PDF-');
	});
});

// ─── Entitlement: Parse (uses cached fixtures) ───────────────────────────────

describe('API: Parse', () => {
	it('POST /DE/xrechnung/parse → documents entitlement status', async () => {
		const fixture = loadFixture('de-xrechnung');
		const { status, data } = await api('POST', `${API_PREFIX}/DE/xrechnung/parse`, {
			data: fixture,
			filename: 'invoice.xml',
		});

		if (status === 403) {
			expect(data.error).toBe('FORBIDDEN');
			expect(data.message).toContain('Missing entitlement');
		} else if (status === 404) {
			expect(data.message || data.error).toBeDefined();
		} else {
			expect(status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.invoice).toBeDefined();
		}
	});

	it('POST /parse (auto-detect) → documents entitlement status', async () => {
		const fixture = loadFixture('de-xrechnung');
		const { status, data } = await api('POST', `${API_PREFIX}/parse`, {
			data: fixture,
			filename: 'invoice.xml',
		});

		if (status === 403) {
			expect(data.error).toBe('FORBIDDEN');
			expect(data.message).toContain('Missing entitlement');
		} else if (status === 404) {
			expect(data.message || data.error).toBeDefined();
		} else {
			expect(status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.detection).toBeDefined();
		}
	});
});

// ─── Error Cases ──────────────────────────────────────────────────────────────

describe('API: Errors', () => {
	it('invalid API key → 401', async () => {
		const res = await fetch(`${BASE_URL}${API_PREFIX}/formats`, {
			headers: { Authorization: 'Bearer sk_live_invalid_key' },
		});
		expect(res.status).toBe(401);
	});

	it('unsupported country → 400/403/404', async () => {
		const { status, data } = await api('POST', `${API_PREFIX}/XX/pdf/generate`, {
			invoice: invoiceData,
		});
		expect([400, 403, 404]).toContain(status);
		expect(data.error || data.message).toBeDefined();
	});

	it('empty invoice → 400/422', async () => {
		const { status } = await api('POST', `${API_PREFIX}/DE/validate`, {
			invoice: {},
		});
		expect([400, 422]).toContain(status);
	});
});
