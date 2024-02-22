
const express = require('express');
const cors = require('cors');
const { firebaseAuth, firebaseDb,multer,uuid,bucket} = require('./firebase/index.js');
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

const storage = multer.memoryStorage();
const upload = multer({ storage :storage });

// Route to get pending cases and total number of cases for blood emergency
app.get('/blood-emergency', async (req, res) => {
    try {
        const bloodEmergencyRef = firebaseDb.collection('Cases').where('category', '==', 'blood emergency');
        const snapshot = await bloodEmergencyRef.get();
        
        const pendingCases = snapshot.docs.filter(doc => !doc.data().resolved).length;
        const totalCases = snapshot.docs.length;

        return res.status(200).json({ pendingCases, totalCases });
    } catch (error) {
        console.error('Error fetching blood emergency cases:', error);
        return res.status(500).json({ error: 'Failed to fetch blood emergency cases.' });
    }
});

// Similar routes for other categories: blood requirement, anonymous report, reported issues
// Replace 'blood emergency' with appropriate category names in the below routes

// Route to get pending cases and total number of cases for blood requirement
// Route to get all cases as total cases and pending cases
// Route to get total cases and pending cases for different categories
app.get('/cases/:category', async (req, res) => {
    const category = req.params.category;

    try {
        let collectionRef;

        // Determine the collection based on the category
        switch (category) {
            case 'be':
                collectionRef = firebaseDb.collection('Blood Em');
                break;
            case 'ar':
                collectionRef = firebaseDb.collection('Ano Report');
                break;
            case 'cr':
                collectionRef = firebaseDb.collection('Report an issue');
                break;
            case 'br':
                collectionRef = firebaseDb.collection('BloodReq');
                break;
            default:
                return res.status(400).json({ error: 'Invalid category.' });
        }

        // Fetch all cases and count pending cases
        const snapshot = await collectionRef.get();
        const totalCases = snapshot.docs.length;
        const pendingCases = snapshot.docs.filter(doc => doc.data().status === 'pending').length;

        return res.status(200).json({ totalCases, pendingCases });
    } catch (error) {
        console.error(`Error fetching ${category} cases:`, error);
        return res.status(500).json({ error: `Failed to fetch ${category} cases.` });
    }
});

app.post('/add-patners', upload.single('image'), async (req, res) => {
    if(!req.file)
    {
        res.status(400).send('No file uploaded');
    }
    const brandname = req.body.brandname; // Assuming brandname is sent as part of the request body
    const url = req.body.url; 
    const metadata =
    {
        metadata:
        {
            firebaseStorageDownloadTokens: uuid()
        },
        contentType: req.file.mimetype,
        cacheControl : 'public, max-age=31536000'
    };
    const blob = bucket.file(`patners/${req.file.originalname}`);
    const blobStream = blob.createWriteStream({
        metadata:metadata,
        gzip :true,
    });
    blobStream.on('error', (err) => {
        return res.status(500).json({error:"unable to upload image"})
    });

    blobStream.on('finish', async () => {
        const imageUrl = `https://firebasestorage.googleapis.com/${bucket.name}/o/${blob.name}`;
        try {
            const supporterRef = firebaseDb.collection('Patners').doc();
            await supporterRef.set({
                brandname: brandname,
                url: url,
                image: imageUrl
            });
            
            return res.status(201).json({ imageUrl, brandname, url });
        } catch (error) {
            console.error('Error adding patner:', error);
            return res.status(500).json({ error: "Failed to add patner. Please try again." });
        }
        
    });

    blobStream.end(req.file.buffer);
})

app.get('/get-patners', async (req, res) => {
    try {
        const supportersSnapshot = await firebaseDb.collection('Patners').get();
        const supporters = [];
        supportersSnapshot.forEach((doc) => {
            supporters.push({
                id: doc.id,
                ...doc.data()
            });
        });
        return res.status(200).json({ supporters });
    } catch (error) {
        console.error('Error fetching patners:', error);
        return res.status(500).json({ error: "Failed to fetch patners. Please try again." });
    }
});

app.put('/patners/:id', upload.single('image'), async (req, res) => {
    try {
        const supporterId = req.params.id;
        const { brandname, url } = req.body;

        if (!brandname && !url && !req.file) {
            return res.status(400).json({ error: 'No fields to update.' });
        }

        let imageUrl = '';

        // Check if a new image is uploaded
        if (req.file) {
            const metadata = {
                metadata: {
                    firebaseStorageDownloadTokens: uuid()
                },
                contentType: req.file.mimetype,
                cacheControl: 'public, max-age=31536000'
            };

            const blob = bucket.file(`patners/${req.file.originalname}`);
            const blobStream = blob.createWriteStream({
                metadata: metadata,
                gzip: true,
            });

            blobStream.on('error', (err) => {
                console.error('Error uploading image:', err);
                return res.status(500).json({ error: 'Unable to upload image.' });
            });

            blobStream.on('finish', async () => {
                imageUrl = `https://firebasestorage.googleapis.com/${bucket.name}/o/${blob.name}`;
                updateSupporter();
            });

            blobStream.end(req.file.buffer);
        } else {
            updateSupporter();
        }
        async function updateSupporter() {
            const supporterRef = firebaseDb.collection('Patners').doc(supporterId);

            const supporterDoc = await supporterRef.get();
            if (!supporterDoc.exists) {
                return res.status(404).json({ error: 'Patner not found.' });
            }

            const updateData = {};

            if (brandname) {
                updateData.brandname = brandname;
            }

            if (url) {
                updateData.url = url;
            }

            if (imageUrl) {
                updateData.image = imageUrl;
            }

            await supporterRef.update(updateData);

            return res.status(200).json({ message: 'patner updated successfully.' });
        }
    } catch (error) {
        console.error('Error updating patner:', error);
        return res.status(500).json({ error: 'Failed to update patner.' });
    }
});

app.post('/add-supporters', upload.single('image'), async (req, res) => {
    if(!req.file)
    {
        res.status(400).send('No file uploaded');
    }
    const firstname = req.body.firstname; // Assuming brandname is sent as part of the request body
    const lastname = req.body.lastname; 
    const designation = req.body.designation;
    const area = req.body.area;
    const metadata =
    {
        metadata:
        {
            firebaseStorageDownloadTokens: uuid()
        },
        contentType: req.file.mimetype,
        cacheControl : 'public, max-age=31536000'
    };
    const blob = bucket.file(`supporters/${req.file.originalname}`);
    const blobStream = blob.createWriteStream({
        metadata:metadata,
        gzip :true,
    });
    blobStream.on('error', (err) => {
        return res.status(500).json({error:"unable to upload image"})
    });

    blobStream.on('finish', async () => {
        const imageUrl = `https://firebasestorage.googleapis.com/${bucket.name}/o/${blob.name}`;
        try {
            const supporterRef = firebaseDb.collection('Supporters').doc();
            await supporterRef.set({
                firstname: firstname,
                lastname: lastname,
                designation: designation,
                area: area,
                image: imageUrl
            });
            
            return res.status(201).json({ firstname, lastname, designation, area, image: imageUrl });
        } catch (error) {
            console.error('Error adding supporter:', error);
            return res.status(500).json({ error: "Failed to add supporter. Please try again." });
        }
        
    });

    blobStream.end(req.file.buffer);
})

app.get('/get-supporters', async (req, res) => {
    try {
        const supportersSnapshot = await firebaseDb.collection('Supporters').get();
        const supporters = [];
        supportersSnapshot.forEach((doc) => {
            supporters.push({
                id: doc.id,
                ...doc.data()
            });
        });
        return res.status(200).json({ supporters });
    } catch (error) {
        console.error('Error fetching Supporters:', error);
        return res.status(500).json({ error: "Failed to fetch supporters. Please try again." });
    }
});

app.put('/supporters/:id', upload.single('image'), async (req, res) => {
    try {
        const supporterId = req.params.id;
        const { firstName, lastName, designation, area, contribution} = req.body;

        if (!firstName && !lastName && !designation && !area && !contribution && !req.file) {
            return res.status(400).json({ error: 'No fields to update.' });
        }

        let imageUrl = '';

        // Check if a new image is uploaded
        if (req.file) {
            const metadata = {
                metadata: {
                    firebaseStorageDownloadTokens: uuid()
                },
                contentType: req.file.mimetype,
                cacheControl: 'public, max-age=31536000'
            };

            const blob = bucket.file(`supporters/${req.file.originalname}`);
            const blobStream = blob.createWriteStream({
                metadata: metadata,
                gzip: true,
            });

            blobStream.on('error', (err) => {
                console.error('Error uploading image:', err);
                return res.status(500).json({ error: 'Unable to upload image.' });
            });

            blobStream.on('finish', async () => {
                imageUrl = `https://firebasestorage.googleapis.com/${bucket.name}/o/${blob.name}`;
                updateSupporter();
            });

            blobStream.end(req.file.buffer);
        } else {
            updateSupporter();
        }

        async function updateSupporter() {
            const supporterRef = firebaseDb.collection('Supporters').doc(supporterId);

            const supporterDoc = await supporterRef.get();
            if (!supporterDoc.exists) {
                return res.status(404).json({ error: 'Supporter not found.' });
            }

            const updateData = {};

            if (firstName) {
                updateData.firstName = firstName;
            }

            if (lastName) {
                updateData.lastName = lastName;
            }

            if (designation) {
                updateData.designation = designation;
            }

            if (area) {
                updateData.area = area;
            }

            if (contribution) {
                updateData.contribution = contribution;
            }

            if (imageUrl) {
                updateData.image = imageUrl;
            }

            await supporterRef.update(updateData);

            return res.status(200).json({ message: 'Supporter updated successfully.' });
        }
    } catch (error) {
        console.error('Error updating supporter:', error);
        return res.status(500).json({ error: 'Failed to update supporter.' });
    }
});

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
            status
        } = req.body;

        // Fetch user details to ensure the user exists
        const userDoc = await firebaseDb.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Validate input fields for blood emergency
        if (!bloodType || !hospitalAddress || !location || !pincode || !mobileNumber || !name || !hospitalName || !status) {
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
            status
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

// blood requirement 
app.post('/bloodreq', async (req, res) => {
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
            status,
            purposeOfBlood
        } = req.body;

        // Fetch user details to ensure the user exists
        const userDoc = await firebaseDb.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Validate input fields for blood emergency
        if (!bloodType || !hospitalAddress || !location || !pincode || !mobileNumber || !name || !hospitalName || !status || !purposeOfBlood) {
            return res.status(400).json({ error: 'All fields are required for blood requirement.' });
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
            status,
            purposeOfBlood
            // createdAt: admin.firestore.FieldValue.serverTimestamp(), // Use admin.firestore.FieldValue
        };

        // Add the blood emergency record to the Blood Em collection
        const bloodEmergencyRef = await firebaseDb.collection('bloodReq').add(bloodEmergencyData)
            .catch(error => {
                console.error('Error adding record:', error);
                res.status(500).json({ error: 'Failed to add  record.' });
            });

        if (bloodEmergencyRef) {
            res.status(201).json({ message: 'Blood requirement record created successfully.', id: bloodEmergencyRef.id });
        } else {
            res.status(500).json({ error: 'Failed to create record.' });
        }
    } catch (error) {
        console.error('Error creating blood requirement record:', error);
        res.status(500).json({ error: 'Failed to create blood requirement record.' });
    }
});

app.get('/blood-req', async (req, res) => {
    try {
      // Query Blood Em collection to get all documents
      const bloodEmergencySnapshot = await firebaseDb.collection('bloodReq').get();
  
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
      console.error('Error fetching user details from blood requirements:', error);
      res.status(500).json({ error: 'Failed to fetch user details from blood requirements.' });
  }
  });
app.post('/anonymousreport', async (req, res) => {
    try {
        const {
            userId,
            place,
            date,
            time,
            report,
            status
        } = req.body;

        // Fetch user details to ensure the user exists
        const userDoc = await firebaseDb.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Validate input fields for blood emergency
        if (!place || !date || !time || !report || !status) {
            return res.status(400).json({ error: 'All fields are required for anonymous report.' });
        }

        // Create a new blood emergency record with createdAt timestamp
        const AnoData = {
            userId,
            place,
            date,
            time,
            report,
            status
            // createdAt: admin.firestore.FieldValue.serverTimestamp(), // Use admin.firestore.FieldValue
        };

        // Add the blood emergency record to the Blood Em collection
        const AnoRef = await firebaseDb.collection('Ano Report').add(AnoData)
            .catch(error => {
                console.error('Error reporting Anonymously:', error);
                res.status(500).json({ error: 'Failed to create report .' });
            });

        if (AnoRef) {
            res.status(201).json({ message: 'Report created successfully.', id: AnoRef.id });
        } else {
            res.status(500).json({ error: 'Failed to create report.' });
        }
    } catch (error) {
        console.error('Error anonymous report', error);
        res.status(500).json({ error: 'Failed to create report.' });
    }
});

app.get('/blood-req/:id', async (req, res) => {
    try {
        const reportId = req.params.id;

        // Fetch the anonymous report document from the 'AnonymousReports' collection
        const reportDoc = await firebaseDb.collection('bloodReq').doc(reportId).get();

        // Check if the report exists
        if (!reportDoc.exists) {
            return res.status(404).json({ error: 'Anonymous report not found.' });
        }

        const reportData = reportDoc.data();
        const userId = reportData.userId;

        // Fetch the user document associated with the report
        const userDoc = await firebaseDb.collection('users').doc(userId).get();

        // Check if the user exists
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const userData = userDoc.data();

        // Construct the response object containing both report and user details
        const response = {
            Report: reportData,
            user: userData,
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Error fetching report details:', error);
        res.status(500).json({ error: 'Failed to fetch report details.' });
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

app.get('/anonymous-reports', async (req, res) => {
    try {
        // Query the 'AnonymousReports' collection to get all documents
        const anonymousReportsSnapshot = await firebaseDb.collection('Ano Report').get();

        const reportsDetails = [];
        // Iterate over anonymous reports
        for (const doc of anonymousReportsSnapshot.docs) {
            const reportData = doc.data();
            // Fetch user details to get the user's display name
            console.log(reportData)
            const userDoc = await firebaseDb.collection('users').doc(reportData.userId).get();
            const userData = userDoc.data();

            // Extract specific details and add them to the array
            const reportDetails = {
                // userId: reportData.userId,
                displayName: userData.displayName,
                place: reportData.place,
                time: reportData.time,
                status: reportData.status,
                report: reportData.report
            };
            reportsDetails.push(reportDetails);
        }

        res.status(200).json(reportsDetails);
    } catch (error) {
        console.error('Error fetching anonymous reports:', error);
        res.status(500).json({ error: 'Failed to fetch anonymous reports.' });
    }
});

app.get('/anonymous-reports/:id', async (req, res) => {
    try {
        const reportId = req.params.id;

        // Fetch the anonymous report document from the 'AnonymousReports' collection
        const reportDoc = await firebaseDb.collection('Ano Report').doc(reportId).get();

        // Check if the report exists
        if (!reportDoc.exists) {
            return res.status(404).json({ error: 'Anonymous report not found.' });
        }

        const reportData = reportDoc.data();
        const userId = reportData.userId;

        // Fetch the user document associated with the report
        const userDoc = await firebaseDb.collection('users').doc(userId).get();

        // Check if the user exists
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const userData = userDoc.data();

        // Construct the response object containing both report and user details
        const response = {
            Report: reportData,
            user: userData,
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Error fetching report details:', error);
        res.status(500).json({ error: 'Failed to fetch report details.' });
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

app.post('/callback-requests', async (req, res) => {
    try {
        const { name, mobile,date, time,status, userId } = req.body;

        // Validate input fields
        if (!name || !mobile || !time || !userId || !date) {
            return res.status(400).json({ error: 'All fields are required for callback request.' });
        }

        // Create a new callback request record
        const callbackRequestData = {
            name,
            mobile,
            date,
            time,
            status,
            userId
        };

        // Add the callback request record to the 'CallbackRequests' collection
        const callbackRequestRef = await firebaseDb.collection('callbacks').add(callbackRequestData);

        res.status(201).json({ message: 'Callback request created successfully.', id: callbackRequestRef.id });
    } catch (error) {
        console.error('Error creating callback request:', error);
        res.status(500).json({ error: 'Failed to create callback request.' });
    }
});

app.get('/callback-requests', async (req, res) => {
    try {
        // Query the 'AnonymousReports' collection to get all documents
        const anonymousReportsSnapshot = await firebaseDb.collection('callbacks').get();

        const reportsDetails = [];
        // Iterate over anonymous reports
        for (const doc of anonymousReportsSnapshot.docs) {
            const reportData = doc.data();
            // Fetch user details to get the user's display name
            console.log(reportData)
            const userDoc = await firebaseDb.collection('users').doc(reportData.userId).get();
            const userData = userDoc.data();

            // Extract specific details and add them to the array
            const reportDetails = {
                // userId: reportData.userId,
                displayName: userData.displayName,
                mobile: reportData.mobile,
                date: reportData.date,
                time: reportData.time,
                status: reportData.status,
            };
            reportsDetails.push(reportDetails);
        }

        res.status(200).json(reportsDetails);
    } catch (error) {
        console.error('error fetching callback reports:', error);
        res.status(500).json({ error: 'Failed to fetch callback reports.' });
    }
});

app.get('/callback-requests/:id', async (req, res) => {
    try {
        const reportId = req.params.id;

        // Fetch the anonymous report document from the 'AnonymousReports' collection
        const reportDoc = await firebaseDb.collection('callbacks').doc(reportId).get();

        // Check if the report exists
        if (!reportDoc.exists) {
            return res.status(404).json({ error: 'callback report not found.' });
        }

        const reportData = reportDoc.data();
        const userId = reportData.userId;

        // Fetch the user document associated with the report
        const userDoc = await firebaseDb.collection('users').doc(userId).get();

        // Check if the user exists
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const userData = userDoc.data();

        // Construct the response object containing both report and user details
        const response = {
            Report: reportData,
            user: userData,
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Error fetching report details:', error);
        res.status(500).json({ error: 'Failed to fetch report details.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
