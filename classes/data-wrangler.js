export default class DataWrangler {
	constructor (OrbitDB) {
		this.db = OrbitDB
	}
	async createDatabase(type, name) {
		if (!name) { return Error('No name specified') }
		const options = {
			accessController: {
				write: [this.db.identity.id],
			},
			overwrite: true,
			replicate: true
		}

		const db = await this.db.docstore(name, options)
		const { root, path } = await this.db.determineAddress(name, 'docstore')
		const address = db.address.toString() 
		console.log(`${root}/${path}`)
		console.log('=====================================');
		console.log(address);

	}
	deleteDatabase(hash) {

	}
}