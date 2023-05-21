import express from 'express';
import cors from 'cors';
import { MongoClient, Db, Collection, ObjectId } from 'mongodb';

export const app = express();

app.use(cors({ origin: true }));

app.use(express.json());
app.use(express.raw({ type: 'application/vnd.custom-type' }));
app.use(express.text({ type: 'text/html' }));

// Healthcheck endpoint
app.get('/', (req, res) => {
	res.status(200).send({ status: 'ok' });
});

const api = express.Router();

// Connection URI
const uri = 'mongodb://mongo:SXo216P8OZjWL3ERi3Pq@containers-us-west-60.railway.app:6502';

// Database and collection names
const dbName = 'test';
const feedbackCollectionName = 'feedback';
const userCollectionName = 'users';


// Create a new MongoClient
const client = new MongoClient(uri);
let db: Db;
let feedbackCollection: Collection;
let userCollection: Collection;

// Connect to the MongoDB server
try {
	await client.connect();
	console.log('Connected to the database');
	db = client.db(dbName);
	feedbackCollection = db.collection(feedbackCollectionName);
	userCollection = db.collection(userCollectionName);
} catch (err) {
	console.error('Failed to connect to the database:', err);
	process.exit(1);
}

// Handle POST request for test results
app.post('/getresults', async (req, res) => {
	const { _id } = req.body;
  
	try {
		const userId = new ObjectId(_id);
    	const result = await userCollection.findOne({ _id: userId });

		// Authentication successful
		res.status(200).json(result);
	} catch (err) {
		console.error('Failed to find user:', err);
		res.sendStatus(500);
	}
});

// Handle POST request for test results
app.post('/postresults', async (req, res) => {
	const { _id, result } = req.body;

	console.log(_id, result);
  
	try {
		const userId = new ObjectId(_id);
		const update = { $set: { results: result } };

		const results = await userCollection.updateOne({ _id: userId }, update);

    	console.log(`${results.modifiedCount} document(s) updated`);

		// Authentication successful
		res.sendStatus(200);
	} catch (err) {
		console.error('Failed to authenticate user:', err);
		res.sendStatus(500);
	}
});

// Handle POST request for feedback
app.post('/feedback', (req, res) => {
	const { firstName, lastName, phoneNumber, message } = req.body;

	// Insert the feedback into the collection
	feedbackCollection.insertOne({ firstName, lastName, phoneNumber, message })
	.then(() => {
		res.sendStatus(200);
	})
	.catch((err) => {
		console.error('Failed to insert feedback:', err);
		res.sendStatus(500);
	});
});

// Handle POST request for user authentication
app.post('/login', async (req, res) => {
	const { email, password } = req.body;
  
	try {
		// Find the user in the user collection
		const user = await userCollection.findOne({ email: email });
		const username = user.username;
		const results = user.results;
	
		if (user.password === password) {
			const existingUser = {
				_id: user._id,
				username: username,
                email: email,
                password: password,
                results: results
            };

            res.status(200).json(existingUser);
		} else {
			// Authentication failed
			res.sendStatus(401);
		}
	} catch (err) {
		console.error('Failed to authenticate user:', err);
		res.sendStatus(500);
	}
});
  
// Handle POST request for user registration
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Check if the user already exists in the user collection
        const existingUser = await userCollection.findOne({ email: email });
        const results = [];

        if (existingUser != null) {
            res.sendStatus(409);
        } else {
			let newUser = {
				username: username,
				email: email,
				password: password,
				results: results
			};
			  
            const result = await userCollection.insertOne(newUser);

            const userId = result.insertedId;
			let data = {
				_id: userId,
				username: newUser.username,
				email: newUser.email,
				password: newUser.password,
				results: newUser.results
			}

            res.status(200).json(data);
        }
    } catch (err) {
        console.error('Failed to register user:', err);
        res.sendStatus(500);
    }
});



// Handle POST request for update data
app.post('/update', (req, res) => {
	const { _id, username, email, password, results } = req.body;
  
	try {
		const updateFields = {
			username: username,
			email: email,
			password: password,
			results: results
		};

		const userId = new ObjectId(_id);
		  
		userCollection.updateOne({ _id: userId }, { $set: updateFields })
		.then(() => {
			console.log('Документ успешно обновлен');
		})
		.catch(error => {
			console.error('Ошибка при обновлении документа:', error);
		});
		  

		// Update successful
		res.sendStatus(200);
	} catch (err) {
		console.error('Failed to update data:', err);
		res.sendStatus(500);
	}
});

// Version the api
app.use('/api/v1', api);