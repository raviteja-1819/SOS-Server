const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const { log } = require('console');
const app = express();
if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);
  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    console.log('Forking a new worker...');
    cluster.fork();
  });
} else {
  const app = express();
  // Middleware
  app.use(cors());
  app.use(bodyParser.json());
  // mysql connection
  const connection = mysql.createConnection({
    host: '45.112.49.217',
    user: 'root',
    password: 'password',
    database: 'aid'
  });
  // Connect to MySQL
  connection.connect((err) => {
    if (err) {
      console.error('Error connecting to database: ', err);
      return;
    }
    console.log('Connected to MySQL database.');
  });
// Middleware to parse JSON bodies
app.use(express.json());
// generating the userID
function generateUserID() {
    const timestamp = Date.now().toString(36);
    const randomChars = Math.random().toString(36).substring(2);
    const userID = timestamp + randomChars;
    return userID.substring(0, 28).padEnd(28, '0');
  }
//signup
app.post('/signup', (req, res) => {
  const {
    firstName,
    lastName,
    mobileNumber,
    email,
    password,
    dateOfBirth,
    age,
    gender,
    bloodGroup,
    address,
    emergencyContact1,
    emergencyContact2,
    emergencyContact3,
    alternateNumber,
    pincode,
    confirmPassword,
    coordinatesLatitude,
    coordinatesLongitude
  } = req.body;
  // Check if all required fields are provided
  if (!firstName || !lastName || !mobileNumber || !email || !password || !dateOfBirth || !age || !gender || !bloodGroup || !address || !emergencyContact1 || !emergencyContact2 || !emergencyContact3  || !alternateNumber || !pincode || !confirmPassword || !coordinatesLatitude || !coordinatesLongitude) {
      console.log(!firstName,!lastName,!mobileNumber, !email,!password,!dateOfBirth,!age , !gender , !bloodGroup , !address, !emergencyContact1 ,!emergencyContact2,!emergencyContact3 , !alternateNumber , !pincode , !confirmPassword , !coordinatesLatitude , !coordinatesLongitude);
      return res.status(400).send('All fields are required');
  }
  // Check if password and confirmPassword match
  if (password !== confirmPassword) {
    return res.status(400).send('Password and confirm password do not match');
  }
  // Generate 28-character userID
  const userID = generateUserID();
  console.log('Generated UserID:', userID);
  // Insert user details into NewProfileSignups table
  connection.query(
    'INSERT INTO users (firstName, lastName, mobileNumber, email, dateOfBirth, age, gender, bloodGroup, address, userID, emergencyContact1,emergencyContact2,emergencyContact3,alternateNumber, pincode, coordinatesLatitude, coordinatesLongitude ) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?, ?)',
    [firstName, lastName, mobileNumber, email, dateOfBirth, age, gender, bloodGroup, address, userID,emergencyContact1,emergencyContact2,emergencyContact3, alternateNumber, pincode, coordinatesLatitude, coordinatesLongitude , ],
    (error, results) => {
      if (error) {
        console.error('Error inserting user details into users:', error);
        return res.status(500).send('Internal Server Error');
      }
      res.status(201).json({ message: 'Account created successfully', userID });
    }
  );
});
  // Login route
  app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
    connection.query(query, [email, password], (err, results) => {
      if (err) {
        console.error('Error logging in:', err);
        res.status(500).json({ message: 'Internal server error' });
        return;
      }
      if (results.length === 0) {
        res.status(401).json({ message: 'Invalid email or password' });
      } else {
        res.status(200).json({ message: 'Login successful', user: results[0] });
      }
    });
  });
// Define the validateFields middleware function
function validateFields(req, res, next) {
  const { userId, name, mobileNumber, place, pincode, status, coordinatesLatitude, coordinatesLongitude } = req.body;
  if (!userId||!name || !mobileNumber || !place || !pincode || !status || !coordinatesLatitude || !coordinatesLongitude) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  next();
}
//emergency contacts
app.post('/add-contact/:person', validateFields, (req, res) => {
  const {userId, name, relation, mobilenumber, coordinatesLatitude, coordinatesLongitude } = req.body;
  // Insert contact information into MySQL database
  const query = 'INSERT INTO emergencyContacts (userId, name, relation, mobilenumber,  coordinatesLatitude, coordinatesLongitude) VALUES (?, ?, ?, ?, ?, ?)';
  connection.query(query, [userId, name, relation, mobilenumber,  coordinatesLatitude, coordinatesLongitude], (error, results) => {
      if (error) {
          console.error('Error adding emergency contact:', error);
          return res.status(500).json({ error: 'Internal server error' });
      }
      res.status(201).json({ message: `Emergency contact added for ${userId}` });
  });
});
  // Retrieve emergency contacts for a person
  app.get('/contacts', (req, res) => {
    const userId = req.header('userId');  // Extract the id parameter from the request URL
  
    // Query the database to retrieve emergency contacts for the specified person ID
    connection.query('SELECT * FROM emergencyContacts WHERE userId = ?', userId, (error, results) => {
      if (error) {
        console.error('Error retrieving emergency contacts:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      // Check if any emergency contacts were found for the specified person ID
      if (results.length === 0) {
        return res.status(404).json({ error: 'Person not found or no emergency contacts available' });
      }
      // Return the emergency contacts for the specified person ID
      res.json(results);
    });
});
// POST endpoint to handle blood checkup creation
app.post('/bloodcheckup', validateFields, (req, res) => {
  const { userId,name, mobileNumber, place, pincode, status, coordinatesLatitude, coordinatesLongitude } = req.body;
  // Insert blood checkup data into the database
  connection.query(
    'INSERT INTO bloodCheckup (userId,name, mobileNumber, place, status, pincode, coordinatesLatitude, coordinatesLongitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [userId,name, mobileNumber, place, status, pincode, coordinatesLatitude, coordinatesLongitude],
    (error, result) => {
      if (error) {
       console.error('Error inserting details into bloodCheckup:', error);
        return res.status(500).send('Internal Server Error');
      }
      // Retrieve the auto-generated userId and send response
      const userId = result.insertId;
      res.status(201).json({ userId, message: 'Blood checkup created successfully' });
    }
  );
});
// Updated route definition to accept userId as a query parameter
app.get('/bloodcheckup', (req, res) => {
  const userId = req.header('userId'); // Extract the userId from request headers
  // Check if userId header is missing or empty
  if (!userId) {
    return res.status(400).json({ message: 'userId header is required' });
  }
  connection.query('SELECT * FROM bloodCheckup WHERE userId = ?', userId, (err, results) => {
    if (err) {
      console.error('Error retrieving blood checkup:', err);
      return res.status(500).json({ message: 'Error retrieving blood checkup' });
    }
    // If blood checkup not found, return 404
    if (results.length === 0) {
      return res.status(404).json({ message: 'Blood checkup not found' });
    }
    // Send the retrieved blood checkup data in the response
    const bloodCheckup = results[0];
    res.json(bloodCheckup);
  });
});
app.use(express.json());
// Define the validateFields middleware function
function validateFields(req, res, next) {
  const { userId,name, relation, mobilenumber, coordinatesLatitude, coordinatesLongitude } = req.body;
  if (!userId||!name || !relation || !mobilenumber  || !coordinatesLatitude || !coordinatesLongitude) {
    return res.status(400).json({ error: 'all fields are required' });
  }
  next();
}
  // anonymous report
  function insertanonymousReport(reportData) {
    return new Promise((resolve, reject) => {
      const query = 'INSERT INTO anonymousReport (userId,date, time, placeOfIncident, subject, explaininBrief,coordinatesLatitude,coordinatesLongitude, status) VALUES (?, ?, ?, ?, ?,?, ?, ?, ?)';
      connection.query(query, [reportData.userId,reportData.date, reportData.time, reportData.placeOfIncident, reportData.subject, reportData.explaininBrief, reportData.coordinatesLatitude, reportData.coordinatesLongitude , reportData.status], (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results);
      });
    });
  }
  // post anonymous reports
  app.post('/anonymousreport', (req, res) => {
    const { userId,date, time, placeOfIncident, subject, explaininBrief,coordinatesLatitude,coordinatesLongitude , status } = req.body;
    if (!userId||!date || !time || !placeOfIncident || !subject || !explaininBrief ||!coordinatesLatitude ||!coordinatesLongitude ||!status) {
      return res.status(400).send('All fields are required');
    }
    // Validate date
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).send('Invalid date format. Date should be in YYYY-MM-DD format');
    }
    // Validate time
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(time)) {
      return res.status(400).send('Invalid time format. Time should be in HH:MM format (24-hour)');
    }
    // Insert report data into the database
    insertanonymousReport(req.body)
      .then(() => {
        console.log('Anonymous report submitted successfully');
        res.status(201).send('Report submitted successfully!');
      })
      .catch(error => {
        console.error('Error submitting anonymous report:', error);
        res.status(500).send('Internal Server Error');
      });
  });
  app.get('/anonymousreports', (req, res) => {
    const userId = req.header('userId'); // Extract the userId from request headers
    if (!userId) {
      return res.status(400).json({ message: 'userId header is required' });
    }
    connection.query('SELECT * FROM anonymousReport WHERE userId = ?', userId, (err, results) => {
      if (err) {
        console.error('Error retrieving anonymous reports:', err);
        return res.status(500).send('Internal Server Error');
      }
      res.json(results);
    });
  });
  // bloodemergency
  app.post('/blood-emergency', (req, res) => {
    const {
        userId,
        patientName,
        bloodType,
        mobileNumber,
        hospitalName,
        hospitalAddress,
        location,
        pincode,
        purposeOfBlood,
        coordinatesLatitude,
        coordinatesLongitude,
        status
    } = req.body;

    if (!userId || !patientName || !bloodType || !mobileNumber || !hospitalName || !hospitalAddress || !location || !pincode || !purposeOfBlood || !coordinatesLatitude || !coordinatesLongitude || !status) {
        return res.status(400).send('All fields are required');
    }
    // Insert blood emergency request into the database
    const query = 'INSERT INTO BloodEmergency (userId, patientName, bloodType, mobileNumber, hospitalName, hospitalAddress, location, pincode, purposeOfBlood, coordinatesLatitude, coordinatesLongitude, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const values = [userId, patientName, bloodType, mobileNumber, hospitalName, hospitalAddress, location, pincode, purposeOfBlood, coordinatesLatitude, coordinatesLongitude, status];
    
    connection.query(query, values, (error, results) => {
        if (error) {
            console.error('Error inserting blood emergency request:', error);
            return res.status(500).send('Internal Server Error');
        }
        res.status(201).send('Blood emergency request submitted successfully!');
    });
});
app.get('/blood-emergency', (req, res) => {
  const userId = req.header('userId');  // Extract the userId from query parameters
  if (!userId) {
    return res.status(400).json({ message: 'userId parameter is required' });
  }
  // Query the database to retrieve blood emergency data for the specified userId
  connection.query('SELECT * FROM BloodEmergency WHERE userId = ?', userId, (err, results) => {
    if (err) {
      console.error('Error retrieving blood emergency:', err);
      return res.status(500).send('Internal Server Error');
    }
    res.json(results);
  });
});
// blood requirements
app.post('/blood-requirements', async (req, res) => {
  const { userId, patientName, date, time, bloodType, mobileNumber, hospitalName, hospitalAddress, purposeOfBlood, pincode, status, coordinatesLatitude, coordinatesLongitude } = req.body;

  // Check if all required fields are provided
  if (!userId || !patientName || !date || !time || !bloodType || !mobileNumber || !hospitalName || !hospitalAddress || !purposeOfBlood || !pincode || !status || !coordinatesLatitude || !coordinatesLongitude) {
    return res.status(400).send('All fields are required');
  }
  try {
    // Insert blood requirement into BloodRequirement table
    await new Promise((resolve, reject) => {
      connection.query(
        'INSERT INTO bloodRequirement (userId, patientName, date, time, bloodType, mobileNumber, hospitalName, hospitalAddress, purposeOfBlood, pincode, status, coordinatesLatitude, coordinatesLongitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, patientName, date, time, bloodType, mobileNumber, hospitalName, hospitalAddress, purposeOfBlood, pincode, status, coordinatesLatitude, coordinatesLongitude],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results);
          }
        }
      );
    });
    res.status(201).send('Blood requirement created');
  } catch (error) {
    console.error('Error creating blood requirement:', error);
    res.status(500).send('Internal Server Error');
  }
});
// blood requirements
app.get('/blood-requirements', async (req, res) => {
  try {
    const userId = req.header('userId');

    // Check if userId is provided in headers
    if (!userId) {
      return res.status(401).json({ message: 'userId parameter is required in headers' });
    }

    // Retrieve all blood requirements for a specific user from the BloodRequirement table
    const bloodRequirements = await new Promise((resolve, reject) => {
      connection.query('SELECT * FROM bloodRequirement WHERE userId = ?', userId, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
    res.json(bloodRequirements);
  } catch (error) {
    console.error('Error retrieving blood requirements:', error);
    res.status(500).send('Internal Server Error');
  }
});
// Callback requests
app.post('/callback', (req, res) => {
    const { userId, name, date, time,place, mobileNumber, subject, topictospeakabout, status, coordinatesLatitude, coordinatesLongitude } = req.body;

    if (!userId || !name || !date || !time ||!place|| !mobileNumber || !subject || !topictospeakabout || !status || !coordinatesLatitude || !coordinatesLongitude) {
        return res.status(400).send('All fields are required');
    }
    const callbackRequest = {
        userId,
        name,
        date,
        time,
        place,
        mobileNumber,
        subject,
        topictospeakabout,
        status,
        coordinatesLatitude,
        coordinatesLongitude
    };
    // Insert callback request into the database
    connection.query('INSERT INTO callbackRequest SET ?', callbackRequest, (error, results) => {
        if (error) {
            console.error('Error inserting callback request:', error);
            return res.status(500).send('Internal Server Error');
        }
        console.log('Callback request inserted successfully');
        res.status(201).send('Callback request received');
    });
});
// Endpoint to retrieve all callback requests
app.get('/callback/:id?', (req, res) => {
  console.log('entered');
 
  // console.log(id);
  const userId = req.header('userId'); // Extract the userId from request headers

  // Check if userId header is missing or empty
  if (!userId) {
    return res.status(400).json({ message: 'userId header is required' });
  }

  // Retrieve all callback requests from the database
  if (req.params.id) {
    console.log('true');
    connection.query('SELECT * FROM callbackRequest WHERE id = ?',req.params.id, (error, results) => {
      if (error) {
        console.error('Error retrieving callback requests:', error);
        return res.status(500).send('Internal Server Error');
      }
      res.json(results);
    });
  } else {
    console.log('false');
    connection.query('SELECT * FROM callbackRequest', (error, results) => {
      if (error) {
        console.error('Error retrieving callback requests:', error);
        return res.status(500).send('Internal Server Error');
      }
      res.json(results);
    });
  }
});
//list af all users
app.get('/users', (req, res) => {
  const userId = req.header('userId'); // Extract the userId from request headers
  // Check if userId header is missing or empty
  if (!userId) {
    return res.status(400).json({ message: 'userId header is required' });
  }
  const query = 'SELECT * FROM signup';
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      res.status(500).json({ message: 'Internal server error' });
      return;
    }
    res.status(200).json(results);
  });
});
// to fetch a single user using userID
app.get('/users/:userId', (req, res) => {
  const userId = req.header('userId'); 
  // Check if userId is provided in the route parameters
  if (!userId) {
    return res.status(400).json({ message: 'userId parameter is required' });
  }
  const query = 'SELECT * FROM users WHERE userId = ?';
  connection.query(query, userId, (err, results) => {
    if (err) {
      console.error('Error fetching user:', err);
      res.status(500).json({ message: 'Internal server error' });
      return;
    }
    // Check if user was found
    if (results.length === 0) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.status(200).json(results[0]);
  });
});
// list of sponsors
app.post('/sponsors', (req, res) => {
  const userId = req.header('userId'); // Extract the userId from request headers

  // Check if userId header is missing or empty
  if (!userId) {
    return res.status(400).json({ message: 'userId header is required' });
  }
  // Extract data from request body
  const { firstName, lastName, designation, area } = req.body;
  // Check if all required fields are provided
  if (!firstName || !lastName || !designation || !area) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  // Prepare the SQL query to insert data into the sponsors table
  const query = 'INSERT INTO sponsors (firstName, lastName, designation, area) VALUES (?, ?, ?, ?)';
  // Execute the query with parameters
  connection.query(query, [firstName, lastName, designation, area], (err, results) => {
    if (err) {
      console.error('Error adding sponsor:', err);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
    res.status(201).json({ message: 'Sponsor added successfully' });
  });
});
// to fetch all the sponsors
app.get('/sponsors', (req, res) => {
  const userId = req.header('userId'); // Extract the userId from request headers
  // Check if userId header is missing or empty
  if (!userId) {
    return res.status(400).json({ message: 'userId header is required' });
  }
  // Prepare the SQL query to select all data from the partners table
  const query = 'SELECT * FROM sponsors';
  // Execute the query
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching partners:', err);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
    res.status(200).json(results);
  });
});
// Endpoint to get a single sponsor by sponsorId
app.get('/sponsors/:sponsorId', (req, res) => {
  const sponsorId = req.params.sponsorId;
  // Prepare the SQL query to select the sponsor with the specified sponsorId
  const query = 'SELECT * FROM sponsors WHERE sponsorId = ?';
  // Execute the query with the sponsorId parameter
  connection.query(query, [sponsorId], (err, results) => {
    if (err) {
      console.error('Error fetching sponsor:', err);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
    // Check if a sponsor with the specified sponsorId was found
    if (results.length === 0) {
      return res.status(404).json({ message: 'Sponsor not found' });
    }
    // Send the retrieved sponsor as a JSON response
    res.status(200).json(results[0]);
  });
});
// add and display partners
app.post('/partners', (req, res) => {
  const userId = req.header('userId'); // Extract the userId from request headers
  // Check if userId header is missing or empty
  if (!userId) {
    return res.status(400).json({ message: 'userId header is required' });
  }
  // Extract data from request body
  const { name, link } = req.body;
  // Check if all required fields are provided
  if (!name || !link ) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  // Prepare the SQL query to insert data into the partners table
  const query = 'INSERT INTO partners (name, link) VALUES (?, ?)';
  // Execute the query with parameters
  connection.query(query, [name, link], (err, results) => {
    if (err) {
      console.error('Error adding partner:', err);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
    res.status(201).json({ message: 'Partner added successfully' });
  });
});
// GET endpoint to display all partners data
app.get('/partners', (req, res) => {
  const userId = req.header('userId'); // Extract the userId from request headers
  // Check if userId header is missing or empty
  if (!userId) {
    return res.status(400).json({ message: 'userId header is required' });
  }
  // Prepare the SQL query to select all data from the partners table
  const query = 'SELECT * FROM partners';
  // Execute the query
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching partners:', err);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
    res.status(200).json(results);
  });
});
// to fetch a specific partner
app.get('/partners/:partnerId', (req, res) => {
  const partnerId = req.params.partnerId;
  // Prepare the SQL query to select the partner with the specified partnerId
  const query = 'SELECT * FROM partners WHERE partnerId = ?';
  // Execute the query with the partnerId parameter
  connection.query(query, [partnerId], (err, results) => {
    if (err) {
      console.error('Error fetching partner:', err);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
    // Check if a partner with the specified partnerId was found
    if (results.length === 0) {
      return res.status(404).json({ message: 'Partner not found' });
    }
    // Send the retrieved partner as a JSON response
    res.status(200).json(results[0]);
  });
});
// list of all blood requirements
app.get('/blood-requirement/:id?', (req, res) => {
  console.log('entered');
  const userId = req.header('userId'); // Extract the userId from request headers
  // Check if userId header is missing or empty
  if (!userId) {
    return res.status(400).json({ message: 'userId header is required' });
  }
  // If an ID is provided in the URL, fetch a single blood requirement case by that ID
  if (req.params.id) {
    console.log('true');
    connection.query('SELECT * FROM bloodRequirement WHERE id = ?', req.params.id, (error, results) => {
      if (error) {
        console.error('Error retrieving blood requirement case:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
      }
      res.json(results);
    });
  } else {
    console.log('false');
    // If no ID is provided, retrieve all blood requirement cases for the user
    connection.query('SELECT * FROM bloodRequirement WHERE userId = ?', userId, (error, results) => {
      if (error) {
        console.error('Error retrieving blood requirement cases:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
      }
      res.json(results);
    });
  }
});
// list of all reported issues
app.get('/reportedissues/:id?', (req, res) => {
  console.log('entered');
  const userId = req.header('userId'); // Extract the userId from request headers
  // Check if userId header is missing or empty
  if (!userId) {
    return res.status(400).json({ message: 'userId header is required' });
  }
  // If an ID is provided in the URL, fetch a single reported issue by that ID
  if (req.params.id) {
    console.log('true');
    connection.query('SELECT * FROM reportIssue WHERE Id = ?', req.params.id, (error, results) => {
      if (error) {
        console.error('Error retrieving reported issue:', error);
        return res.status(500).send('Internal Server Error');
      }
      res.json(results);
    });
  } else {
    console.log('false');
    // If no ID is provided, retrieve all reported issues
    connection.query('SELECT * FROM reportIssue', (error, results) => {
      if (error) {
        console.error('Error retrieving reported issues:', error);
        return res.status(500).send('Internal Server Error');
      }
      res.json(results);
    });
  }
});
// list of all bloodcheckups
app.get('/bloodcheckups/:id?', (req, res) => {
  const userId = req.header('userId'); // Extract the userId from request headers
  // Check if userId header is missing or empty
  if (!userId) {
    return res.status(400).json({ message: 'userId header is required' });
  }
  // Retrieve blood checkups based on ID if provided, otherwise retrieve all blood checkups
  if (req.params.id) {
    // Fetch a single blood checkup report based on the provided ID
    connection.query('SELECT * FROM bloodCheckup WHERE id = ?', req.params.id, (error, results) => {
      if (error) {
        console.error('Error retrieving blood checkup report:', error);
        return res.status(500).send('Internal Server Error');
      }
      // Check if the blood checkup report with the specified ID was found
      if (results.length === 0) {
        return res.status(404).json({ message: 'Blood checkup report not found' });
      }
      // Send the retrieved blood checkup report as a JSON response
      res.json(results[0]);
    });
  } else {
    // Fetch all blood checkup reports
    connection.query('SELECT * FROM bloodCheckup', (error, results) => {
      if (error) {
        console.error('Error retrieving blood checkup reports:', error);
        return res.status(500).send('Internal Server Error');
      }
      // Send all retrieved blood checkup reports as a JSON response
      res.json(results);
    });
  }
});
//list of all the bloodemergency
// GET endpoint to retrieve blood emergency reports
app.get('/bloodEmergency/:userId?', (req, res) => {
  const userId = req.header('userId'); // Extract the userId from request headers
  // Check if userId header is missing or empty
  if (!userId) {
    return res.status(400).json({ message: 'userId header is required' });
  }
  // If userId is provided in the URL, retrieve blood emergency reports for that user
  if (req.params.userId) {
    const userIdParam = req.params.userId;
    // Prepare the SQL query to select blood emergency reports for the specified userId
    const query = 'SELECT * FROM bloodEmergency WHERE userId = ?';
    // Execute the query with the userId parameter
    connection.query(query, userIdParam, (err, results) => {
      if (err) {
        console.error('Error fetching blood emergency reports:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
      }
      res.status(200).json(results);
    });
  } else {
    // If userId is not provided in the URL, retrieve all blood emergency reports
    // Prepare the SQL query to select all data from the bloodEmergency table
    const query = 'SELECT * FROM bloodEmergency';
    // Execute the query
    connection.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching blood emergency reports:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
      }
      res.status(200).json(results);
    });
  }
});
// list of anonymous report
app.get('/anonymousreport/:id?', (req, res) => {
  console.log('entered');
  const userId = req.header('userId'); // Extract the userId from request headers
  // Check if userId header is missing or empty
  if (!userId) {
    return res.status(400).json({ message: 'userId header is required' });
  }
  // If an ID is provided in the URL, fetch a single anonymous report by that ID
  if (req.params.id) {
    console.log('true');
    connection.query('SELECT * FROM anonymousReport WHERE id = ?', req.params.id, (error, results) => {
      if (error) {
        console.error('Error retrieving anonymous report:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
      }
      res.json(results);
    });
  } else {
    console.log('false');
    // If no ID is provided, retrieve all anonymous reports
    connection.query('SELECT * FROM anonymousReport', (error, results) => {
      if (error) {
        console.error('Error retrieving anonymous reports:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
      }
      res.json(results);
    });
  }
});
// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
}