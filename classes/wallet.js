import pkg from 'bitcore-lib';
const { Address } = pkg;

export default class Wallet {
	constructor (OrbitDB) {
		this.db = OrbitDB
	}

	async addWallet(walletId, name = null) {
		try {
			if (!walletId) { return Error('Wallet ID not present') }

			if (!Address.isValid(walletId)) { return Error('Invalid address')}

			await this.db.put({ name, walletId })

		} catch (e) {
			return e;
		}
	}

	async getWallets() {
		return await this.db.get('')
	}

	async getWallet(walletId) {
		if (!walletId) { return Error('Wallet ID not present') }
		const wallet = await this.db.get(walletId)
		return wallet.length ? wallet[0]  : null
	}
}