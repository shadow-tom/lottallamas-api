import auth from "./auth.js"
import jwt from 'jsonwebtoken'
import { jest } from '@jest/globals';

const generateToken = () => {
	return jwt.sign({ address: 'bar' }, 'shh')
}

const mockResponse = () => {
	const res = {};
	res.status = jest.fn().mockReturnValue(res);
	res.send = jest.fn().mockReturnValue(res);
	res.json = jest.fn().mockReturnValue(res);
	return res;
};

const mockRequest = ( req = {} ) => {
	req.headers = {
		authorization: generateToken(),
		address: 'bar'
	}
	return req;
};

describe('testing auth middleware', () => {
	test('Missing header', async () => {
		let req = mockRequest();
		const res = mockResponse();

		delete req.headers;

		await auth(req, res, () => {});

		expect(res.send).toHaveBeenCalledWith({ error: 'Missing headers' });
		expect(res.status).toHaveBeenCalledWith(401);
	});

	test('Missing auth token', async () => {
		let req = mockRequest();
		const res = mockResponse();

		req.headers.authorization = 'null'

		await auth(req, res, () => {});

		expect(res.send).toHaveBeenCalledWith({ error: 'No authorization token present' });
		expect(res.status).toHaveBeenCalledWith(401);
	});

	test('Address mismatch', async () => {
		let req = mockRequest();
		const res = mockResponse();

		req.headers.address = 'foo'

		await auth(req, res, () => {});

		expect(res.send).toHaveBeenCalledWith({ error: 'Address mismatch' });
		expect(res.status).toHaveBeenCalledWith(401);
	});

	test('Pass', async () => {
		let req = mockRequest();
		const res = mockResponse();

		await auth(req, res, () => {
			expect.anything()
		});
	});
});