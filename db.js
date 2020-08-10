const mongoose = require('mongoose');
const config = require('config');

const connectDB = async () => {

	const DB = config.get('MONGO_URI').replace('<PASSWORD>', config.get('MONGO_PASSWORD'));

	try {
		await mongoose.connect(DB, {
			useNewUrlParser: true,
			useCreateIndex: true,
      		useFindAndModify: false,
      		useUnifiedTopology: true
		});

		console.log('MongoDB Connected...');
	} catch (err) {
		console.error(err.message);
		// Exit process with failure
		process.exit(1);
	}
};

module.exports = connectDB;