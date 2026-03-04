import type { IExecuteFunctions, INodeExecutionData, IBinaryData, IDataObject } from 'n8n-workflow';

interface MockOverrides {
	nodeParameters?: Record<string, unknown>;
	credentials?: Record<string, unknown>;
	continueOnFail?: boolean;
	binaryData?: Record<string, IBinaryData>;
	httpResponse?: unknown;
}

/**
 * Creates a mock IExecuteFunctions for testing n8n node operations.
 */
export function createMockExecuteFunctions(overrides: MockOverrides = {}): IExecuteFunctions {
	const nodeParameters = overrides.nodeParameters ?? {};
	const credentials = overrides.credentials ?? {
		apiKey: 'sk_test_mock_key',
		baseUrl: 'https://service.invoice-api.xhub.io',
	};

	const mockHttpRequest = jest.fn().mockResolvedValue(overrides.httpResponse ?? { success: true });
	const mockPrepareBinaryData = jest.fn().mockImplementation(
		async (buffer: Buffer, fileName?: string, mimeType?: string): Promise<IBinaryData> => ({
			data: buffer.toString('base64'),
			mimeType: mimeType ?? 'application/octet-stream',
			fileName: fileName ?? 'file',
			fileExtension: fileName?.split('.').pop() ?? '',
		}),
	);
	const mockGetBinaryDataBuffer = jest
		.fn()
		.mockResolvedValue(Buffer.from('mock-binary-data'));

	return {
		getNodeParameter: jest.fn().mockImplementation((name: string, _index: number, fallback?: unknown) => {
			if (name in nodeParameters) {
				return nodeParameters[name];
			}
			if (fallback !== undefined) {
				return fallback;
			}
			throw new Error(`Parameter "${name}" not found in mock`);
		}),
		getNode: jest.fn().mockReturnValue({
			name: 'InvoiceXhub',
			type: 'n8n-nodes-base.invoiceXhub',
			typeVersion: 1,
			position: [0, 0],
		}),
		continueOnFail: jest.fn().mockReturnValue(overrides.continueOnFail ?? false),
		getCredentials: jest.fn().mockResolvedValue(credentials),
		helpers: {
			httpRequestWithAuthentication: mockHttpRequest,
			prepareBinaryData: mockPrepareBinaryData,
			getBinaryDataBuffer: mockGetBinaryDataBuffer,
		},
	} as unknown as IExecuteFunctions;
}

/**
 * Creates a minimal INodeExecutionData item, optionally with binary data.
 */
export function createMockItem(
	json: IDataObject = {},
	binary?: Record<string, IBinaryData>,
): INodeExecutionData {
	const item: INodeExecutionData = { json };
	if (binary) {
		item.binary = binary;
	}
	return item;
}
