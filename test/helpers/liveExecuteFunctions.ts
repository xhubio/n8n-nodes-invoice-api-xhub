import type {
	IExecuteFunctions,
	INodeExecutionData,
	IBinaryData,
	IDataObject,
	IHttpRequestOptions,
} from 'n8n-workflow';
import * as fs from 'fs';
import * as path from 'path';

interface LiveOverrides {
	nodeParameters?: Record<string, unknown>;
	continueOnFail?: boolean;
	binaryData?: Record<string, IBinaryData>;
}

function loadEnv(): { apiKey: string; baseUrl: string } {
	const envPath = path.resolve(__dirname, '..', '..', '.env.local');
	const content = fs.readFileSync(envPath, 'utf-8');
	const match = content.match(/^API_KEY=(.+)$/m);
	if (!match) throw new Error('API_KEY not found in .env.local');
	return {
		apiKey: match[1].trim(),
		baseUrl: 'https://service.invoice-api.xhub.io',
	};
}

/**
 * Creates an IExecuteFunctions context that makes real HTTP calls to the API.
 * Only the n8n framework interface is mocked — httpRequestWithAuthentication
 * delegates to fetch() with actual credentials.
 */
export function createLiveExecuteFunctions(overrides: LiveOverrides = {}): IExecuteFunctions {
	const { apiKey, baseUrl } = loadEnv();
	const nodeParameters = overrides.nodeParameters ?? {};
	const credentials = { apiKey, baseUrl };

	const liveHttpRequest = jest.fn().mockImplementation(
		async (_credentialType: string, options: IHttpRequestOptions) => {
			const headers: Record<string, string> = {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
			};

			const maxRetries = 3;
			for (let attempt = 1; attempt <= maxRetries; attempt++) {
				const fetchOptions: RequestInit = {
					method: options.method as string,
					headers,
				};

				if (options.method !== 'GET' && options.body) {
					fetchOptions.body = JSON.stringify(options.body);
				}

				const res = await fetch(options.url as string, fetchOptions);

				// Retry on transient server errors (not 429 quota — those won't recover)
				if (attempt < maxRetries && res.status >= 500) {
					const delay = attempt * 2000;
					await new Promise((r) => setTimeout(r, delay));
					continue;
				}

				const data = (await res.json()) as Record<string, unknown>;

				if (!res.ok) {
					const err = Object.assign(
						new Error((data.message as string) || (data.error as string) || 'API Error'),
						{ ...data, httpStatusCode: res.status },
					);
					throw err;
				}

				return data;
			}
		},
	);

	const livePrepareBinaryData = jest.fn().mockImplementation(
		async (buffer: Buffer, fileName?: string, mimeType?: string): Promise<IBinaryData> => ({
			data: buffer.toString('base64'),
			mimeType: mimeType ?? 'application/octet-stream',
			fileName: fileName ?? 'file',
			fileExtension: fileName?.split('.').pop() ?? '',
		}),
	);

	const liveGetBinaryDataBuffer = jest
		.fn()
		.mockImplementation(async (_itemIndex: number, propertyName: string) => {
			const binaryData = overrides.binaryData?.[propertyName];
			if (!binaryData) throw new Error(`No binary data for property "${propertyName}"`);
			return Buffer.from(binaryData.data, 'base64');
		});

	return {
		getNodeParameter: jest.fn().mockImplementation(
			(name: string, _index: number, fallback?: unknown) => {
				if (name in nodeParameters) {
					return nodeParameters[name];
				}
				if (fallback !== undefined) {
					return fallback;
				}
				throw new Error(`Parameter "${name}" not found in mock`);
			},
		),
		getNode: jest.fn().mockReturnValue({
			name: 'InvoiceXhub',
			type: 'n8n-nodes-base.invoiceXhub',
			typeVersion: 1,
			position: [0, 0],
		}),
		continueOnFail: jest.fn().mockReturnValue(overrides.continueOnFail ?? false),
		getCredentials: jest.fn().mockResolvedValue(credentials),
		helpers: {
			httpRequestWithAuthentication: liveHttpRequest,
			prepareBinaryData: livePrepareBinaryData,
			getBinaryDataBuffer: liveGetBinaryDataBuffer,
		},
	} as unknown as IExecuteFunctions;
}

/**
 * Creates a minimal INodeExecutionData item, optionally with binary data.
 */
export function createLiveItem(
	json: IDataObject = {},
	binary?: Record<string, IBinaryData>,
): INodeExecutionData {
	const item: INodeExecutionData = { json };
	if (binary) {
		item.binary = binary;
	}
	return item;
}

// ─── Fixture cache ────────────────────────────────────────────────────────────

const FIXTURES_DIR = path.resolve(__dirname, '..', 'fixtures');

/**
 * Load a cached fixture (base64 string) from disk, or return undefined.
 */
export function loadFixture(name: string): string | undefined {
	const filePath = path.join(FIXTURES_DIR, `${name}.b64`);
	if (fs.existsSync(filePath)) {
		return fs.readFileSync(filePath, 'utf-8').trim();
	}
	return undefined;
}

/**
 * Save a fixture (base64 string) to disk for future runs.
 */
export function saveFixture(name: string, data: string): void {
	if (!fs.existsSync(FIXTURES_DIR)) {
		fs.mkdirSync(FIXTURES_DIR, { recursive: true });
	}
	fs.writeFileSync(path.join(FIXTURES_DIR, `${name}.b64`), data, 'utf-8');
}
