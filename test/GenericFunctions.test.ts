import {
	buildErrorMessage,
	base64ToBinary,
	binaryToBase64,
	invoiceXhubApiRequest,
	type InvoiceXhubApiResponse,
} from '../shared/GenericFunctions';

describe('GenericFunctions', () => {
	describe('buildErrorMessage', () => {
		it('should return error field', () => {
			const response: InvoiceXhubApiResponse = { success: false, error: 'Something failed' };
			expect(buildErrorMessage(response)).toBe('Something failed');
		});

		it('should return message field', () => {
			const response: InvoiceXhubApiResponse = { success: false, message: 'Details here' };
			expect(buildErrorMessage(response)).toBe('Details here');
		});

		it('should combine error and message', () => {
			const response: InvoiceXhubApiResponse = {
				success: false,
				error: 'Error',
				message: 'Message',
			};
			expect(buildErrorMessage(response)).toBe('Error; Message');
		});

		it('should format validation errors', () => {
			const response: InvoiceXhubApiResponse = {
				success: false,
				errors: [
					{ code: 'E001', message: 'Invalid VAT ID', field: 'seller.vatId' },
				],
			};
			expect(buildErrorMessage(response)).toBe('E001: Invalid VAT ID: (field: seller.vatId)');
		});

		it('should include quota info', () => {
			const response: InvoiceXhubApiResponse = {
				success: false,
				error: 'Rate limited',
				quota: { current: 100, limit: 100, period: 'minute' },
			};
			expect(buildErrorMessage(response)).toContain('Rate limited');
			expect(buildErrorMessage(response)).toContain('Quota: 100/100 (minute)');
		});

		it('should return "Unknown error" for empty response', () => {
			const response: InvoiceXhubApiResponse = { success: false };
			expect(buildErrorMessage(response)).toBe('Unknown error');
		});

		it('should handle errors without field', () => {
			const response: InvoiceXhubApiResponse = {
				success: false,
				errors: [{ code: 'E002', message: 'Total mismatch' }],
			};
			expect(buildErrorMessage(response)).toBe('E002: Total mismatch');
		});
	});

	describe('base64ToBinary / binaryToBase64', () => {
		it('should round-trip binary data', () => {
			const original = Buffer.from('Hello, invoice world!');
			const base64 = binaryToBase64(original);
			const restored = base64ToBinary(base64);
			expect(restored).toEqual(original);
		});

		it('should handle empty data', () => {
			const empty = Buffer.from('');
			const base64 = binaryToBase64(empty);
			const restored = base64ToBinary(base64);
			expect(restored).toEqual(empty);
		});

		it('should convert Uint8Array to base64', () => {
			const uint8 = new Uint8Array([72, 101, 108, 108, 111]);
			const base64 = binaryToBase64(uint8);
			expect(base64).toBe('SGVsbG8=');
		});
	});

	describe('invoiceXhubApiRequest', () => {
		it('should trim trailing slashes from baseUrl', async () => {
			const mockHttp = jest.fn().mockResolvedValue({ success: true });
			const mockContext = {
				getCredentials: jest.fn().mockResolvedValue({
					apiKey: 'sk_test_key',
					baseUrl: 'https://api.example.com/',
				}),
				getNode: jest.fn().mockReturnValue({ name: 'Test' }),
				helpers: {
					httpRequestWithAuthentication: mockHttp,
				},
			};

			await invoiceXhubApiRequest.call(
				mockContext as any,
				'POST',
				'/api/v1/invoice/DE/xrechnung/generate',
				{ invoice: {} },
			);

			const callArgs = mockHttp.mock.calls[0];
			const options = callArgs[1];
			expect(options.url).toBe('https://api.example.com/api/v1/invoice/DE/xrechnung/generate');
		});

		it('should remove body for GET requests', async () => {
			const mockHttp = jest.fn().mockResolvedValue({ success: true });
			const mockContext = {
				getCredentials: jest.fn().mockResolvedValue({
					apiKey: 'sk_test_key',
					baseUrl: 'https://api.example.com',
				}),
				getNode: jest.fn().mockReturnValue({ name: 'Test' }),
				helpers: {
					httpRequestWithAuthentication: mockHttp,
				},
			};

			await invoiceXhubApiRequest.call(
				mockContext as any,
				'GET',
				'/api/v1/invoice/formats',
			);

			const callArgs = mockHttp.mock.calls[0];
			const options = callArgs[1];
			expect(options.body).toBeUndefined();
		});

		it('should throw NodeApiError on failure', async () => {
			const mockHttp = jest.fn().mockRejectedValue(new Error('Network error'));
			const mockContext = {
				getCredentials: jest.fn().mockResolvedValue({
					apiKey: 'sk_test_key',
					baseUrl: 'https://api.example.com',
				}),
				getNode: jest.fn().mockReturnValue({ name: 'Test' }),
				helpers: {
					httpRequestWithAuthentication: mockHttp,
				},
			};

			await expect(
				invoiceXhubApiRequest.call(mockContext as any, 'POST', '/test', {}),
			).rejects.toThrow();
		});
	});
});
