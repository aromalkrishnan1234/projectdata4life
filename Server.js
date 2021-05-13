const express = require('express')
const app = express()
var sqlite3 = require('sqlite3').verbose()
var db = new sqlite3.Database('weather')
require('dotenv').config()
var request = require('request');

getDates=()=>{
    var curr = new Date; // get current date
    var first = curr.getDate() - curr.getDay(); // First day is the day of the month - the day of the week
    var last = first + 6; // last day is the first day + 6

    var firstday = new Date(curr.setDate(first)).toUTCString();
    var lastday = new Date(curr.setDate(last)).toUTCString();
    return ({firstday:new Date(firstday),lastday:new Date(lastday)})

}
function isEmptyObject(obj) {
    return !Object.keys(obj).length;
}

dbInsert=(id,name,jpl,hazardous)=>{
    db.run(`INSERT INTO WeatheData(id,name,nasa_jpl_url,hazardous_values) VALUES(?,?,?,?)`, [id,name,jpl,hazardous], function(err) {
        if (err) {
          return console.log(err.message);
        }
        // get the last insert id
        console.log(`A row has been inserted with rowid ${this.lastID}`);
      });

}

app.get('/probes/liveness', function (req, res) {
    dbInsert()
    res.sendStatus(200,'HelloWorld')
})

app.get('/probes/getAllData', function (req, res) {
    let sql = `SELECT * FROM WeatheData ORDER BY name`;
    db.all(sql, [], (err, rows) => {
    if (err) {
        throw err;
    }
    res.send(JSON.stringify(rows))
    });

  db.close();
})

app.get('/probes/week', function (req, res) {
    const d=getDates()
    const startDate=JSON.stringify(d.firstday).split('T')[0].replace('"','');
    const endDate=JSON.stringify(d.lastday).split('T')[0].replace('"','');
    console.log(startDate)
    console.log(endDate)
    const url=`https://api.nasa.gov/neo/rest/v1/feed?start_date=${startDate}&end_date=${endDate}&api_key=`+process.env.api_key
    // const url='https://api.nasa.gov/neo/rest/v1/feed?start_date=2021-04-27&end_date=2021-05-04&api_key=ndARzsqePx1m67ZUL0NdzB4db2dcX6KbpmWK1AM6'


    var options = {
        'method': 'GET',
        'url': url
    };
    var count=0;
    request(options, function (error, response) {
        if (error) {
        throw new Error(error);
        } else {
            if(isEmptyObject(JSON.parse(response.body).near_earth_objects)){
                res.send("No Neo's in this week ")
            }else{
                // res.send(response.body)
                for(var i in JSON.parse(response.body).near_earth_objects){

                    JSON.parse(response.body).near_earth_objects[i].map((s)=>{
                        count=count+1
                    })
                }
                res.send(`Number of Neo's ${JSON.stringify(count)}`)

            }

        }
    })

})

app.get('/neo/getalldata', function (req, res) {
    const d=getDates()
        // const d=new Date();
        const startDate=JSON.stringify(d.firstday).split('T')[0].replace('"','');
        const endDate=JSON.stringify(d.lastday).split('T')[0].replace('"','');
        // const url=`https://api.nasa.gov/neo/rest/v1/feed?start_date=${startDate}&end_date=${endDate}&api_key=`+process.env.api_key
        const url=`https://api.nasa.gov/neo/rest/v1/feed?start_date=2021-04-20&end_date=2021-04-24&api_key=`+process.env.api_key
        console.log(url)
        console.log(url)
        var options = {
            'method': 'GET',
            'url': url
        };
        request(options, function (error, response) {
            if (error) {
            throw new Error(error);
            } else {
        // console.log(JSON.parse(response.body).near_earth_objects);
        for(var i in JSON.parse(response.body).near_earth_objects){

            JSON.parse(response.body).near_earth_objects[i].map((s)=>{
                console.log(s.id)
                dbInsert(s.id,s.name,s.nasa_jpl_url,s.is_potentially_hazardous_asteroid)
            })
          }
        res.send(JSON.parse(response.body).near_earth_objects)
    }

  });
})

getToday = () => {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1; 
    var yyyy = today.getFullYear();

    if(dd<10) 
    {
        dd='0'+dd;
    } 

    if(mm<10) 
    {
        mm='0'+mm;
    } 
    today = yyyy+'-'+mm+'-'+dd;
    return today;
}

app.get('/neo/next', function (req, res) {
    console.log(req.query.hazardous)
    if (req.query.hazardous == 'true') {
        const startDate=getToday()
        const endDate=getNextWeek()
        const url=`https://api.nasa.gov/neo/rest/v1/feed?start_date=${startDate}&api_key=`+process.env.api_key
        var options = {
            'method': 'GET',
            'url': url
        };
        request(options, function (error, response) {
            if (error) {
            throw new Error(error);
            } else {
                if(isEmptyObject(JSON.parse(response.body).near_earth_objects)){
                    res.send("No Neo's Found")
                }else{
                    let list = [];
                    
                    var options = {
                        'method': 'GET',
                        'url': JSON.parse(response.body).links.next
                    };
                    request(options, function (error, result) {
                        if (error) {
                        throw new Error(error);
                        } else {
                            res.send(result.body)
                        }
                    })
                }

            }
        })
    } else {
        res.send('No data')
    }
    
})

app.listen(3030)