import mongoose from 'mongoose';
import config from 'config';

const connectDB = async () => {
	const DB = config.get('MONGO_URI2').replace('<PASSWORD>', config.get('MONGO_PASSWORD'));
	// Errors propagate: server.js decides to log and exit, so the connection step can be tested and reused
	await mongoose.connect(DB, {
		useNewUrlParser: true,
		useCreateIndex: true,
		useFindAndModify: false,
		useUnifiedTopology: true
	});
	console.log('MongoDB Connected...');
};

export default connectDB;
