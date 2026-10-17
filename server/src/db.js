import mongoose from 'mongoose';
import { config } from './config.js';

const connectDB = async () => {
	// Until the JSON store lands, the API still needs MongoDB; fail with a key name, not a stack trace.
	const DB = config.MONGO_URI;
	if (!DB) throw new Error('MONGO_URI is not set: add it to .env to run the API against MongoDB.');
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
