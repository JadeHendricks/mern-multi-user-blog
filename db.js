const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = async () => {

	const DB = process.env.MONGO_URI.replace('<PASSWORD>', process.env.MONGO_PASSWORD);

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