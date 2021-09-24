'use strict';
var request = require('request');
var express = require('express')
var cors = require('cors')
const fs = require("fs");
const { HistoricalNBBO } = require('finnhub');

var app = express()
app.use(cors())
app.use(function (req, res, next) {
  //set headers to allow cross origin request.
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(express.json());
// add this middleware to read post request body
app.use(express.text());
app.use(express.urlencoded({extended: true}));

const port = 3001

// Reading information from the json
let data;
fs.readFile("./data.json", "utf8", (err, jsonString) => {
  if(err){
    console.log("Error readind the file");
  }
  try {
    const info = JSON.parse(jsonString);
    data = info;
  } catch (err) {
    console.log("Error parsing JSON string:", err);
  }
})

app.post('/read-info', function (req, res) {
    fs.readFile("./data.json", "utf8", (err, jsonString) => {
      if(err){
        console.log("Error readind the file");
      }
      try {
        const info = JSON.parse(jsonString);
        res.send(jsonString);
        res.end();
      } catch (err) {
        console.log("Error parsing JSON string:", err);
      }
    })
})

app.post('/trade-info', async function (req, res) {
    let tradeInfo;
    var symbol = req.body.symbol;
    var url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=LVDJVNIP5RLOPLXD`;
    request.get({
        url: url,
        json: true,
        headers: {'User-Agent': 'request'}
      }, (err, res, data) => {
        if (err) {
        console.log('Error:', err);
        } else if (res.statusCode !== 200) {
        console.log('Status:', res.statusCode);
        } else {
        // data is successfully parsed as a JSON object:
        console.log(data);
        tradeInfo = data;
        }
    });
    setTimeout(function(){
        res.send(tradeInfo);
        res.end();
    },700)
    // res.send(data);
    // res.end();
});

app.post('/write-orders', function (req, res) {
    console.log(req.body);
    if(req.body.type === 'order'){
      req.body.orders.forEach(order => {
        data.orders.push(order);
        let comision = 0.01;
        let iva = 0.16;
        // Pec = Pm (1+(C(1+ IVA)))
        let pec = order.purchase_price * (1 + comision * (1 + iva));
        // VTPec = Pec * Titulos
        let vtpec = pec * order.titles;
        let tipo_cambio = 19.95;
        let remaining = data.saldo - vtpec * tipo_cambio;
        data.saldo = remaining;
      });
    }
    else if(req.body.type === 'option'){
      req.body.options.forEach(option => {
        data.options.push(option);
      });
    }
  
    const stringData = JSON.stringify(data);
    fs.writeFile('./data.json', stringData, err => {
      if (err) {
          console.log('Error writing file', err);
      } else {
          console.log('Successfully wrote file');
          res.send(stringData);
          res.end();
      }
    })
  
  })

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

