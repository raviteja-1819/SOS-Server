const fibaseDb = require('./firebase/index.js');
const express = require('express');
const cors = require('cors');

var app = express()

app.use(cors())

app.use(express.json())

//aid-app@aid-project-af0a9.iam.gserviceaccount.com

app.use(express.urlencoded({
    extended: false
}));

app.get("/", (req, res) => {
    res.send("Its Working ")
})

app.get("/users", async(req, res) => {
    var userId = req.headers["auth"]
    var users = [];
    var data = await fibaseDb.collection("users").doc(userId).get()
    await fibaseDb.collection('users').get()
        .then(querySnapshot => {
            querySnapshot.docs.map(doc => {
                // console.log('LOG 1', doc.data());
                users.push(doc.data())
                return doc.data();
            });
        });

    res.send({
        "data": {
            "single-user": data.data(),
            "all-users": users
        }
    })
})

app.post('/anonymous', async(req, res) => {
    var userId = req.headers["auth"]
    console.log(userId)
    var data = {
        "date": req.body["date"],
        "time": req.body["time"],
        "place": req.body["place"],
        "subject": req.body["subject"],
        "description": req.body["description"]
    }
    var anonymusReports = []
    await fibaseDb.collection('forms').doc(userId).collection('anonymous').get()
        .then(querySnapshot => {
            querySnapshot.docs.map(doc => {
                // console.log('LOG 1', doc.data());
                anonymusReports.push(doc.data())
                return doc.data();
            });
        });
    console.log(anonymusReports.length)
    var docId = anonymusReports.length + 1
    console.log(docId)
    await fibaseDb.collection("forms").doc(userId).collection("anonymous").doc(docId.toString()).set(data).then(() => {
        res.send({
            "message": "Added data",
            "docId": docId,
            "all-reports": docId,
            "path": `forms/${userId}/anonymous/${docId}`,
        })
    })

})

app.post('/bloodrequirment', async(req, res) => {
    var userId = req.headers["auth"]
    console.log(userId)
    var data = {
        "date": req.body["date"],
        "name": req.body["name"],
        "hospitalName": req.body["hospital_name"],
        "hospitalAddress": req.body["hospital_address"],
        "bloodType": req.body["blood_type"],
        "email": req.body["email"],
        "location": req.body["location"],
        "purposeOfBlood": req.body["purposeOfBlood"]
    }
    var anonymusReports = []
    await fibaseDb.collection('forms').doc(userId).collection('blood requirement').get()
        .then(querySnapshot => {
            querySnapshot.docs.map(doc => {
                // console.log('LOG 1', doc.data());
                anonymusReports.push(doc.data())
                return doc.data();
            });
        });
    console.log(anonymusReports.length)
    var docId = anonymusReports.length + 1
    console.log(docId)
    await fibaseDb.collection("forms").doc(userId).collection("blood requirement").doc(docId.toString()).set(data).then(() => {
        res.send({
            "message": "Added data",
            "total": docId,
            "path": `forms/${userId}/blood requirement/${docId}`,
        })
    })

})

app.post('/bloodemergency', async(req, res) => {
    var userId = req.headers["auth"]
    console.log(userId)
    var data = {

        "name": req.body["name"],
        "hospitalName": req.body["hospital_name"],
        "hospitalAddress": req.body["hospital_address"],
        "bloodType": req.body["blood_type"],
        "email": req.body["email"],
        "location": req.body["location"],
        "purposeOfBlood": req.body["purposeOfBlood"]
    }
    var anonymusReports = []
    await fibaseDb.collection('forms').doc(userId).collection('blood emergency').get()
        .then(querySnapshot => {
            querySnapshot.docs.map(doc => {
                // console.log('LOG 1', doc.data());
                anonymusReports.push(doc.data())
                return doc.data();
            });
        });
    console.log(anonymusReports.length)
    var docId = anonymusReports.length + 1
    console.log(docId)
    await fibaseDb.collection("forms").doc(userId).collection("blood emergency").doc(docId.toString()).set(data).then(() => {
        res.send({
            "message": "Added data",
            "total": docId,
            "path": `forms/${userId}/blood emergency/${docId}`,
        })
    })

})


app.post('/bloodcheckup', async(req, res) => {
    var userId = req.headers["auth"]
    console.log(userId)
    var data = {

        "name": req.body["name"],
        "bloodType": req.body["blood_type"],
        "email": req.body["email"],
        "mobile": req.body["mobile"],
        "place": req.body["place"],
        "pincode": req.body["pincode"]
    }
    var anonymusReports = []
    await fibaseDb.collection('forms').doc(userId).collection('blood checkup').get()
        .then(querySnapshot => {
            querySnapshot.docs.map(doc => {
                // console.log('LOG 1', doc.data());
                anonymusReports.push(doc.data())
                return doc.data();
            });
        });
    console.log(anonymusReports.length)
    var docId = anonymusReports.length + 1
    console.log(docId)
    await fibaseDb.collection("forms").doc(userId).collection("blood checkup").doc(docId.toString()).set(data).then(() => {
        res.send({
            "message": "Added data",
            "total": docId,
            "path": `forms/${userId}/blood checkup/${docId}`,
        })
    })

})


app.post('/callback', async(req, res) => {
    var userId = req.headers["auth"]
    console.log(userId)
    var data = {
        "name": req.body["name"],
        "mobile": req.body["mobile"],
        "date": req.body["date"],
        "time": req.body["time"]
    }
    var anonymusReports = []
    await fibaseDb.collection('forms').doc(userId).collection('call back').get()
        .then(querySnapshot => {
            querySnapshot.docs.map(doc => {
                // console.log('LOG 1', doc.data());
                anonymusReports.push(doc.data())
                return doc.data();
            });
        });
    console.log(anonymusReports.length)
    var docId = anonymusReports.length + 1
    console.log(docId)
    await fibaseDb.collection("forms").doc(userId).collection("call back").doc(docId.toString()).set(data).then(() => {
        res.send({
            "message": "We will contact you soon",
            "tatal": docId,
            "path": `forms/${userId}/callback/${docId}`,
        })
    })

})


app.post('/issuereport', async(req, res) => {
    var userId = req.headers["auth"]
    console.log(userId)
    var data = {
        "date": req.body["date"],
        "time": req.body["time"],
        "email": req.body["email"],
        "mobile": req.body["mobile"],
        "subject": req.body["subject"],
        "description": req.body["description"]
    }
    var anonymusReports = []
    await fibaseDb.collection('forms').doc(userId).collection('report your issue').get()
        .then(querySnapshot => {
            querySnapshot.docs.map(doc => {
                // console.log('LOG 1', doc.data());
                anonymusReports.push(doc.data())
                return doc.data();
            });
        });
    console.log(anonymusReports.length)
    var docId = anonymusReports.length + 1
    console.log(docId)
    await fibaseDb.collection("forms").doc(userId).collection("report your issue").doc(docId.toString()).set(data).then(() => {
        res.send({
            "message": "Added data",
            "total": docId,
            "path": `forms/${userId}/report your issue/${docId}`,
        })
    })

})

app.get('/supporters', async(req, res) => {
    try {
        console.log(2)
        var a = []
        await fibaseDb.collection('supporters').get()
            .then(querySnapshot => {
                querySnapshot.docs.map(doc => {
                    // console.log('LOG 1', doc.data());
                    //anonymusReports.push(doc.data())
                    a.push(doc.data())

                    return doc.data();

                });

            });
        if (a.length == 0) {
            res.send({
                "message": "No supporters found"
            })
        } else {
            res.send({
                "supporters": a,
            })
        }
        console.log(3)

    } catch (error) {
        console.log("1")
        res.send({
            "message": error,
            "message2": error.code,
        })
    }
})

app.get('/partners', async(req, res) => {
    try {
        console.log(2)
        var a = []
        await fibaseDb.collection('partners').get()
            .then(querySnapshot => {
                querySnapshot.docs.map(doc => {
                    // console.log('LOG 1', doc.data());
                    //anonymusReports.push(doc.data())
                    a.push(doc.data())

                    return doc.data();

                });

            });
        if (a.length == 0) {
            res.send({
                "message": "No partners found"
            })
        } else {
            res.send({
                "partners": a,
            })
        }
        console.log(3)

    } catch (error) {
        console.log("1")
        res.send({
            "message": error,
            "message2": error.code,
        })
    }
})


app.get('/dashboard', async(req, res) => {

})

app.listen(process.env.PORT || 3000)