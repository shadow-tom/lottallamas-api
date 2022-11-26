import verifyWalletBodyParams from "./body.js"
import { jest } from '@jest/globals';

const mockResponse = () => {
	const res = {};
	res.status = jest.fn().mockReturnValue(res);
	res.send = jest.fn().mockReturnValue(res);
	res.json = jest.fn().mockReturnValue(res);

	return res;
};

const mockRequest = ( req = {} ) => {
	req.body = {
		signature: '1234',
		message: 'Hello there',
		address: '1FBuCHMw5e5yTNKbf1eJq1bXZjoGaXeqwV'
	}
	return req;
};

describe('testing body middleware', () => {
	test('Missing params', async () => {
		let req = mockRequest();
		const res = mockResponse();

		delete req.body;

		await verifyWalletBodyParams(req, res, () => {});

		expect(res.send).toHaveBeenCalledWith({ error: 'Missing params' });
		expect(res.status).toHaveBeenCalledWith(401);
	});

	test('Invalid address', async () => {
		let req = mockRequest();
		const res = mockResponse();

		req.body.address = 'Invalid_Address'

		await verifyWalletBodyParams(req, res, () => {});

		expect(res.send).toHaveBeenCalledWith({ error: 'Invalid address' });
		expect(res.status).toHaveBeenCalledWith(401);
	});

	test('Pass', async () => {
		let req = mockRequest();
		const res = mockResponse();

		await verifyWalletBodyParams(req, res, () => {
			expect.anything()
		});
	});
});