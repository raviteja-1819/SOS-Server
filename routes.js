
const express = require('express');
const cors = require('cors');

const { firebaseAuth, firebaseDb} = require('./firebase/index.js');
// const {signInWithEmailAndPassword, createUserWithEmailAndPassword,getAuth } = require("firebase/auth");
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));
let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password
let mobileNumberRegex = /^[0-9]{10}$/;
let bloodGroupRegex = /^(A|B|AB|O)[+-]$/;
// Get all users route // working 
// this works as new profile signups dashboard 
app.get('/get-users', async (req, res) => {
    try {
      // Retrieve all user profiles from Firestore
      const usersSnapshot = await firebaseDb.collection('users').get();
  
      const users = [];
      usersSnapshot.forEach((doc) => {
        users.push({
          uid: doc.data().uid,
          email: doc.data().email,
          displayName: doc.data().displayName,
          age: doc.data().age,
          gender: doc.data().gender,
        });
      });
  
      res.status(200).json({ users });
    } catch (error) {
      console.error('Error getting users:', error);
      res.status(500).json({ error: 'Failed to retrieve users.' });
    }
  });
// Signup route with extended user profile details // working correctly
app.post('/signup', async (req, res) => {
    try {
      const {
            email,
            password,
            displayName,
            age,
            gender,
            blood_group,
            mobileNumber,
            alternativeNumber,
            address,
        } = req.body;

        if (!email || !password || !displayName) {
            return res.status(400).json({ error: 'Email, password, and display name are required.' });
        }
        if(displayName.length <3)
        {
            return res.status(403).json({"error" :"display name must be atleast 3 letters long"})
            
        }
        if(!email.length)
        {
            return res.status(403).json({"error" :"Enter mail "})

        }
        if(emailRegex.test(email) == false)
        {
            return res.status(403).json({"error" :"Enter valid mail "})
        }
        if(!passwordRegex.test(password))
        {
            return res.status(403).json({"error" :" Password should be 6 to 20 characters long with a numeric 1 lowercase and 1 uppercase letters"})
        }
        if(!mobileNumberRegex.test(mobileNumber))
        {
            return res.status(403).json({"error" :"Enter valid mobile number"})
        }
        if(!bloodGroupRegex.test(blood_group))
        {
            return res.status(403).json({"error" :"Enter valid blood group"})
        }

        // Create user in Firebase Authentication
        const userRecord = await firebaseAuth.createUser({
            email,
            password,
            displayName,
        });

        // Create user profile document in Firestore with extended details
        await firebaseDb.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid,
            email: userRecord.email,
            displayName,
            age,
            gender,
            blood_group,
            mobileNumber,
            alternativeNumber,
            address,
        });

        res.status(201).json({
            uid: userRecord.uid,
            email: userRecord.email,
            displayName,
            age,
            gender,
            blood_group,
            mobileNumber,
            alternativeNumber,
            address,
        });
    } catch (error) {
        console.error('Error creating user and profile:', error);
        res.status(500).json({ error: 'Failed to create user and profile.' });
    }
});
// Signin route // not working 
app.post('/signin', async (req, res) => {
    try {
      const { email, password } = req.body;
  
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }
  
      // Authenticate user with Firebase Authentication
      const userCredential = await firebaseAuth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
  
      // Retrieve additional user profile data from Firestore
      const userProfile = await firebaseDb.collection('users').doc(user.uid).get();
      res.status(200).json({
        uid: user.uid,
        email: user.email,
        displayName: userProfile.data()?.displayName || null,
        age: userProfile.data()?.age || null,
        gender: userProfile.data()?.gender || null,
      });
    } catch (error) {
      console.error('Error signing in:', error);
      res.status(401).json({ error: 'Invalid credentials.' });
    }
  });

  
// Get user details route
// this works as detail board of single user when clicked a new button 
app.get('/user/:uid', async (req, res) => {
  try {
      const uid = req.params.uid;

      if (!uid) {
          return res.status(400).json({ error: 'User UID is required.' });
      }

      // Retrieve user profile data from Firestore based on UID
      const userDoc = await firebaseDb.collection('users').doc(uid).get();

      if (!userDoc.exists) {
          return res.status(404).json({ error: 'User not found.' });
      }

      const userData = userDoc.data();
      res.status(200).json(userData);
  } catch (error) {
      console.error('Error getting user details:', error);
      res.status(500).json({ error: 'Failed to retrieve user details.' });
  }
});

// blood emergency dashboard with person details and his emergency 
app.get('/blood-emergency/:id', async (req, res) => {
  try {
      const bloodEmergencyId = req.params.id;
      console.log(bloodEmergencyId)
      // Fetch blood emergency details
      const bloodEmergencyDoc = await firebaseDb.collection('Blood Em').doc(bloodEmergencyId).get();
      if (!bloodEmergencyDoc.exists) {
          return res.status(404).json({ error: 'Blood emergency not found.' });
      }
      const bloodEmergencyData = bloodEmergencyDoc.data();

      // Fetch user details associated with the blood emergency
      const userId = bloodEmergencyData.userId; // Assuming userId is stored in blood emergency document
      const userDoc = await firebaseDb.collection('users').doc(userId).get();
      if (!userDoc.exists) {
          return res.status(404).json({ error: 'User not found.' });
      }
      const userData = userDoc.data();

      // Combine blood emergency and user details
      const result = {
          bloodEmergency: bloodEmergencyData,
          user: userData,
      };

      res.json(result);
  } catch (error) {
      console.error('Error fetching blood emergency details:', error);
      res.status(500).json({ error: 'Failed to fetch blood emergency details.' });
  }
});
app.get('/issue-reports/:id', async (req, res) => {
  try {
      const issueReportsId = req.params.id;
      console.log(issueReportsId)
      // Fetch blood emergency details
      const issueReportDoc = await firebaseDb.collection('Report an issue').doc(issueReportsId).get();
      if (!issueReportDoc.exists) {
          return res.status(404).json({ error: 'Report not found.' });
      }
      const  issueReportData = issueReportDoc.data();

      // Fetch user details associated with the blood emergency
      const userId = issueReportData.uid; // Assuming userId is stored in blood emergency document
      const userDoc = await firebaseDb.collection('users').doc(userId).get();
      if (!userDoc.exists) {
          return res.status(404).json({ error: 'User not found.' });
      }
      const userData = userDoc.data();

      // Combine blood emergency and user details
      const result = {
          Report: issueReportData,
          user: userData,
      };

      res.json(result);
  } catch (error) {
      console.error('Error fetching blood emergency details:', error);
      res.status(500).json({ error: 'Failed to fetch blood emergency details.' });
  }
});

// posting the details of blood emergency by a logged in user 
app.post('/blood-emergency', async (req, res) => {
  try {
      const {
          userId,
          bloodType,
          hospitalAddress,
          location,
          pincode,
          mobileNumber,
          name,
          hospitalName,
          status
      } = req.body;

      // Fetch user details to ensure the user exists
      const userDoc = await firebaseDb.collection('users').doc(userId).get();
      if (!userDoc.exists) {
          return res.status(404).json({ error: 'User not found.' });
      }

      // Validate input fields for blood emergency
      if (!bloodType || !hospitalAddress || !location || !pincode || !mobileNumber || !name || !hospitalName) {
          return res.status(400).json({ error: 'All fields are required for blood emergency.' });
      }

      // Create a new blood emergency record
      const bloodEmergencyData = {
          userId,
          bloodType,
          hospitalAddress,
          location,
          pincode,
          mobileNumber,
          name,
          hospitalName,
          status,
          // createdAt: admin.firestore.FieldValue.serverTimestamp(), // Add timestamp
      };
      // Add the blood emergency record to the Blood Emergencies collection
      const bloodEmergencyRef = await firebaseDb.collection('Blood Em').add(bloodEmergencyData).get();
      console.log(bloodEmergencyRef);
      res.status(201).json({ message: 'Blood emergency record created successfully.', id: bloodEmergencyRef.uid });
  } catch (error) {
      console.error('Error creating blood emergency record:', error);
      res.status(500).json({ error: 'Failed to create blood emergency record.' });
  }
});

app.post('/bloodemergency', async (req, res) => {
    try {
        const {
            userId,
            bloodType,
            hospitalAddress,
            location,
            pincode,
            mobileNumber,
            name,
            hospitalName,
        } = req.body;

        // Fetch user details to ensure the user exists
        const userDoc = await firebaseDb.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Validate input fields for blood emergency
        if (!bloodType || !hospitalAddress || !location || !pincode || !mobileNumber || !name || !hospitalName) {
            return res.status(400).json({ error: 'All fields are required for blood emergency.' });
        }

        // Create a new blood emergency record with createdAt timestamp
        const bloodEmergencyData = {
            userId,
            bloodType,
            hospitalAddress,
            location,
            pincode,
            mobileNumber,
            name,
            hospitalName,
            // createdAt: admin.firestore.FieldValue.serverTimestamp(), // Use admin.firestore.FieldValue
        };

        // Add the blood emergency record to the Blood Em collection
        const bloodEmergencyRef = await firebaseDb.collection('Blood Em').add(bloodEmergencyData)
            .catch(error => {
                console.error('Error adding blood emergency record:', error);
                res.status(500).json({ error: 'Failed to add blood emergency record.' });
            });

        if (bloodEmergencyRef) {
            res.status(201).json({ message: 'Blood emergency record created successfully.', id: bloodEmergencyRef.id });
        } else {
            res.status(500).json({ error: 'Failed to create blood emergency record.' });
        }
    } catch (error) {
        console.error('Error creating blood emergency record:', error);
        res.status(500).json({ error: 'Failed to create blood emergency record.' });
    }
});

// Fetch all blood emergency records
app.get('/blood-emergencies', async (req, res) => {
  try {
    // Query Blood Em collection to get all documents
    const bloodEmergencySnapshot = await firebaseDb.collection('Blood Em').get();

    const usersDetails = [];
    // Iterate over blood emergency records
    bloodEmergencySnapshot.forEach(doc => {
        const bloodEmergencyData = doc.data();
        // Extract specific details and add them to the array
        const userDetails = {
            // userId: bloodEmergencyData.userId,
            name: bloodEmergencyData.name,
            hospitalName: bloodEmergencyData.hospitalName,
            location: bloodEmergencyData.location,
            bloodType: bloodEmergencyData.bloodType,
            status: bloodEmergencyData.status
        };
        usersDetails.push(userDetails);
    });

    res.status(200).json(usersDetails);
} catch (error) {
    console.error('Error fetching user details from blood emergencies:', error);
    res.status(500).json({ error: 'Failed to fetch user details from blood emergencies.' });
}
});
app.get('/issue-reports', async (req, res) => {
    try {
        // Fetch all issue reports from the 'IssueReports' collection
        const querySnapshot = await firebaseDb.collection('Report an issue').get();

        const issueReports = [];
        // Iterate over the query snapshot to extract issue report data
        querySnapshot.forEach(doc => {
            const issueReportData = doc.data();
            issueReports.push({
                // id: doc.id, // Include the document ID
                email: issueReportData.email,
                mobile: issueReportData.mobile,
                date: issueReportData.date,
                status: issueReportData.status,
                // Add more fields as needed
            });
        });

        res.status(200).json(issueReports);
    } catch (error) {
        console.error('Error fetching issue reports:', error);
        res.status(500).json({ error: 'Failed to fetch issue reports.' });
    }
});
app.get("/callbacks", async(req, res) => {
    var userId = req.headers["auth"]
    var users = [];
    await firebaseDb.collection('call_back_req').get()
        .then(querySnapshot => {
            querySnapshot.docs.map(doc => {
                // console.log('LOG 1', doc.data());
                users.push(doc.data())
                return doc.data();
            });
        });

    res.send({
        "data": {
            "call_back_req": users
        }
    })
})
app.post('/callbacks', async (req, res)=>{
    
        const {
            date,
            time,
            mobileNumber,
            subject,
            topic,
        }=req.body;
   
    const dateTime = new Date(`${date}T${time}`);
    const DateTime = `${dateTime.toDateString()} ${dateTime.toLocaleTimeString()}`;
    console.log('Submitted Data:');
    console.log('Date & Time:', DateTime);
    console.log('Mobile Number:', mobileNumber);
    console.log('Subject:', subject);
    console.log('Topic:', topic);
    
    res.send('Callback request submitted successfully!');
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
