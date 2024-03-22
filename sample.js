const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
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
    'INSERT INTO signup (firstName, lastName, mobileNumber, email, password, dateOfBirth, age, gender, bloodGroup, address, userID, emergencyContact1,emergencyContact2,emergencyContact3,alternateNumber, pincode, coordinatesLatitude, coordinatesLongitude , confirmPassword) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?, ?)',
    [firstName, lastName, mobileNumber, email, password, dateOfBirth, age, gender, bloodGroup, address, userID,emergencyContact1,emergencyContact2,emergencyContact3, alternateNumber, pincode, coordinatesLatitude, coordinatesLongitude , confirmPassword],
    (error, results) => {
      if (error) {
        console.error('Error inserting user details into signup:', error);
        return res.status(500).send('Internal Server Error');
      }
      res.status(201).json({ message: 'Account created successfully', userID });
    }
  );
});
  // Login route
  app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const query = 'SELECT * FROM signup WHERE email = ? AND password = ?';
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
  // Route to get all users
  app.get('/users/:email', (req, res) => {
    const query = 'SELECT * FROM signup WHERE email = ?';
    const email = req.params.email;
    connection.query(query, email, (err, results) => {
      if (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ message: 'Internal server error' });
        return;
      }
      res.status(200).json(results);
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
app.get('/bloodcheckup/:id', (req, res) => {
    const id = req.params.id;
    console.log(id);
    connection.query('SELECT * FROM bloodCheckup WHERE userId = ?', id, (err, results) => {
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
// emergency contacts
app.use(express.json());
// Define the validateFields middleware function
function validateFields(req, res, next) {
  const { userId,name, relation, mobilenumber, coordinatesLatitude, coordinatesLongitude } = req.body;
  if (!userId||!name || !relation || !mobilenumber  || !coordinatesLatitude || !coordinatesLongitude) {
    return res.status(400).json({ error: 'all fields are required' });
  }
  next();
}
// POST endpoint to handle blood checkup creation
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
  app.get('/contacts/:id', (req, res) => {
    const personId = req.params.id; // Retrieve the id parameter from the request URL
  
    // Query the database to retrieve emergency contacts for the specified person ID
    connection.query('SELECT * FROM emergencyContacts WHERE userId = ?', personId, (error, results) => {
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
  app.get('/anonymousreports/:id', (req, res) => {
    const userId = req.params.id;
    connection.query('SELECT * FROM anonymousReport WHERE userId = ?', [userId], (err, results) => {
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
app.get('/blood-emergency/:id', (req, res) => {
  const userId = req.params.id; // Retrieve the id parameter from the request URL

  // Retrieve all blood emergency requests for a specific user from the database
  connection.query('SELECT * FROM BloodEmergency WHERE userId = ?', userId, (err, results) => {
    if (err) {
      console.error('Error retrieving blood emergency requests:', err); // Changed 'error' to 'err' for consistency
      return res.status(500).send('Internal Server Error');
    }
    res.json(results);
  });
});

// blood requirements
app.post('/blood-requirements', async (req, res) => {
  const { userId, patientName, date, time, bloodType, mobileNumber, hospitalName, hospitalAddress, purposeOfBlood, pincode, status, coordinatesLatitude, coordinatesLongitude } = req.body;

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
app.get('/blood-requirements/:id', async (req, res) => {
  try {
    const userId = req.params.id; // Retrieve the id parameter from the request URL

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
app.get('/callbacks/:id', (req, res) => {
  const userId = req.params.id; // Retrieve the id parameter from the request URL
  
  // Retrieve all callback requests for a specific user from the database
  connection.query('SELECT * FROM callbackRequest WHERE userId = ?', userId, (error, results) => {
      if (error) {
          console.error('Error retrieving callback requests:', error);
          return res.status(500).send('Internal Server Error');
      }
      res.json(results);
  });
});

//report an issue
app.post('/report', (req, res) => {
    const { userId, name, date, time, email, mobileNumber, subject, explaininBrief, status, coordinatesLatitude, coordinatesLongitude } = req.body;
  
    // Insert the data into the database
    connection.query('INSERT INTO reportIssue (userId, name, date, time, email, mobileNumber, subject, explaininBrief, status, coordinatesLatitude, coordinatesLongitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
               [userId, name, date, time, email, mobileNumber, subject, explaininBrief, status, coordinatesLatitude, coordinatesLongitude], 
               (error, results, fields) => {
      if (error) {
        console.error('Error inserting report into database:', error);
        res.status(500).send('Error submitting report');
        return;
      }
      console.log('Report submitted successfully!');
      res.status(201).send('Report submitted successfully!');
    });
  });
  
  app.get('/report/:id', (req, res) => {
    const userId = req.params.id; // Retrieve the id parameter from the request URL
    
    // Fetch reports from the database for the specified user ID
    connection.query('SELECT * FROM reportIssue WHERE userId = ?', userId, (error, results, fields) => {
      if (error) {
        console.error('Error fetching reports from database:', error);
        res.status(500).send('Error fetching reports');
        return;
      }
      res.json(results);
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
}