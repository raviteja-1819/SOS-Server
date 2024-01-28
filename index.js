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
    console.log("Hello threre");
    res.send(`<!DOCTYPE html>
    <html>
    <style>
    body, html {
      height: 100%;
      margin: 0;
    }
    
    .bgimg {
      background-image: url('https://png.pngtree.com/thumb_back/fh260/background/20211031/pngtree-abstract-bg-image_914283.png');
      height: 100%;
      background-position: center;
      background-size: cover;
      position: relative;
      color: white;
      font-family: "Courier New", Courier, monospace;
      font-size: 25px;
    }
    
    .topleft {
      position: absolute;
      top: 0;
      left: 16px;
    }
    
    .bottomleft {
      position: absolute;
      bottom: 0;
      left: 16px;
    }
    
    .middle {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
    }
    
    hr {
      margin: auto;
      width: 40%;
    }
    </style>
    <body>
    
    <div class="bgimg">
      <div class="topleft">
        <p>Aid Server</p>
      </div>
      <div class="middle">
        <h1>Sucessfully Hosted</h1>
        <hr>
        <!-- <p id="demo" style="font-size:30px"></p> -->
      </div>
      
    </div>
    
    <script>
    // Set the date we're counting down to
    var countDownDate = new Date("Jan 5, 2024 15:37:25").getTime();
    
    // Update the count down every 1 second
    var countdownfunction = setInterval(function() {
    
      // Get todays date and time
      var now = new Date().getTime();
      
      // Find the distance between now an the count down date
      var distance = countDownDate - now;
      
      // Time calculations for days, hours, minutes and seconds
      var days = Math.floor(distance / (1000 * 60 * 60 * 24));
      var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      var seconds = Math.floor((distance % (1000 * 60)) / 1000);
      
      // Output the result in an element with id="demo"
      document.getElementById("demo").innerHTML = days + "d " + hours + "h "
      + minutes + "m " + seconds + "s ";
      
      // If the count down is over, write some text 
      if (distance < 0) {
        clearInterval(countdownfunction);
        document.getElementById("demo").innerHTML = "EXPIRED";
      }
    }, 1000);
    </script>
    
    </body>
    </html>
    
    `)
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
app.get("/callbacks", async(req, res) => {
    var userId = req.headers["auth"]
    var users = [];
    await fibaseDb.collection('call_back_req').get()
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

app.get('/callback', async(req, res) => {
    var userId = req.headers["auth"]
    console.log(userId)

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
    res.send({
        "message": "Sucessfully Retrived",
        "requests": anonymusReports
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

app.post('/solvedCases', async(req, res) => {
    var userId = req.headers["auth"]
    console.log(userId)
    var data = {
        "name": req.body["name"],
        "date": req.body["date"],
        "time": req.body["time"],
        "email": req.body["email"],
        "mobile": req.body["mobile"],
        "subject": req.body["subject"],
        "description": req.body["description"]
    }
    var anonymusReports = []
    await fibaseDb.collection('solved Cases').get()
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
    await fibaseDb.collection("solved Cases").doc(docId.toString()).set(data).then(() => {
        res.send({
            "message": "Added data",
            "total": docId,
            "path": `/solved Cases/${docId}`,
        })
    })

})


app.get('/solvedCases', async(req, res) => {
    try {
        console.log(2)
        var a = []
        await fibaseDb.collection('solved Cases').get()
            .then(querySnapshot => {
                querySnapshot.docs.map(doc => {
                    // console.log('LOG 1', doc.data());
                    //anonymusReports.push(doc.data())
                    a.push(doc.data())
                        // res.send({
                        //     a,
                        // })
                    return doc.data();

                });

            });
        if (a.length == 0) {
            
            res.send({
                "status":204,
                "message": "No Solved Cases found",
                "data":[]
            })
        } else {
            
            res.send({
                "status":200,
                "message": "Solved Cases found",
                "data":a,
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
console.log(process.env.PORT);
app.listen(process.env.PORT || 3000)