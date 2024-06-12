/* istanbul ignore file */

import dotenv from "dotenv";
dotenv.config() // read ".env"

import http from "http";
import mongoose from 'mongoose';
import app from "./app";
import { logger } from "./logger"
import { readFile } from "fs/promises";
import https from "https";
import { startWebSocketConnection } from "./websockets";
/** 
 * Init setup to connect to MongoDB
 * */ 
const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PW}@${process.env.MONGO_CLUSTER}/?retryWrites=true&w=majority&appName=OceanCombat`;

/**
 * Test .env values
 */
// console.log("Username: " + process.env.MONGO_USER)
// console.log("PW: " + process.env.MONGO_PW)
// console.log("Cluster: " + process.env.MONGO_CLUSTER)

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
  //tls: true  // Etablishes TLS connection
});

async function setup() {

    // // Tests if env variables could get read
    // let mongodURI = uri;
    // if (!mongodURI) {
    //     logger.error(`Cannot start, no database configured. Set environment variable DB_CONNECTION_STRING. Use "memory" for MongoMemoryServer`);
    //     process.exit(1);
    // }

    // logger.info(`Connect to mongod at ${mongodURI}`);
    // //await mongoose.connect(mongodURI);

    // try {
    //     // Connect the client to the server	(optional starting in v4.7)
    //     await client.connect();
    //     console.log("Connection successfully etablished!");
    //     // Send a ping to confirm a successful connection
    //     await client.db("BitBusters").command({ ping: 1 });
    //     console.log("Pinged your deployment. You successfully connected to MongoDB!");
    //   } finally {
    //     // Ensures that the client will close when you finish/error
    //     await client.close();
    //   }

    let mongodURI = process.env.DB_CONNECTION_STRING;
    if (!mongodURI) {
        logger.error(`Cannot start, no database configured. Set environment variable DB_CONNECTION_STRING. Use "memory" for MongoMemoryServer, anything else for real MongoDB server"`);
        process.exit(1);
    }
    if (mongodURI === "memory") {
        logger.info("Start MongoMemoryServer")
        const MMS = await import('mongodb-memory-server')
        const mongo = await MMS.MongoMemoryServer.create();
        mongodURI = mongo.getUri();

        logger.info(`Connect to mongod at ${mongodURI}`)
        await mongoose.connect(mongodURI);
    
        const shouldSSL = process.env.USE_SSL === "true";
        if(shouldSSL) {
    const privateKey = "-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCwiNCa1sdOM/8/
uXP98FMrDV3S2DBSYOlIlBwbUcxc+TthzvqWIztt+hQoE5xRKDLJGBMQ+9UHdcg2
fydaYr9++EgUXZneo/no8q+aPmxovI8CgFvUv06dTF8RRbZ8k+zang6Kal+U22q+
pyYbjlzm+deyMr3XEdt20ysrQyjHHAd1rwWN7qbHObstgoS9ZrVHqssMvnekykO0
vLi+UqNkX2UQWrtzLB08z70kit8HfMKSvcT+rjOue2WaI6lkqCFqm/Je304utgY4
l5hsGfNPwws4b6Xfexw4y37IDgLoUOdJIroQHgJehnTg6GW7D2qBR2nvAqoy7x+z
Y55uesrZAgMBAAECggEATEgiU/YhE0LWthON8poJZh4Vf8lZQA+OXoVZi9iRxU8R
ANeuYngA8ynP0e1/a3ZCU7DqdDlNuTaE+D+DosPu2Y+xndNAbPtQPv+3L6BvueZY
qY0LoWe1MbVRkyYbj8Nf4qvPvrHucWVKv+18QwYGUOx+7wqMC8Y0nijri3suwLI9
MHPGGRqkGAHmeYS0JCBTIGI7g/yFI4cNxHSQZjBimOhnLCqqoQ9MEQr4pWWnn3na
fIg93WNUSuBpja2BWMBgxZcog4CqGTRy2vT32LR0U5fmWn4vOyvRoJxRQS2IQFum
twwMYWCtxwm7mHRsXVPLPvh1RVHmzzs+q6LhirBFgQKBgQDWTGFADtLevtdqsrPA
GrcLwsRXeDGY1tq5Q+HQR6XKVUrGp517gncqDUpKhUML7NfcNQE7eO1xXWESlbL9
xELfe67uQrbPx/uq6L9+JTUiOXrSESJR2UmVAQcAa7Miy9GUgbB9B+r6hVQqF90f
LgbSKFoPf6czDtyuhF4GImHfUQKBgQDS4ynutds3g/x3hOUCXsrlowt/bffBr8SW
9yqdJ5isPuIjsmN1Z438qlYpuvwrd7SMV/sEZUxPdFMnb3HKiBJdxHBo2nRup675
llawjwLbHvC1crnRcvqRT73lTWMLKQAYeYQEFgeg/IBmX5ETiDtii1FsIxYcQLyp
6PCX/BihCQKBgDcFt3aWF8h/YZoQthxd/5+ya201/C4NBG3LIyCyNLxFuARXpxS+
Q9B1RxzpKHTYY/gzV9SoUPbpjfISo7mKec0d2aVtVbj11QVl6zz9Wq4l6gYjxhcT
3lO2xtBx1rXZdT9XKTSBIvEd6KVCKVFHJRMyryUJlqmCaGEatXWHwG9xAoGBAKex
wBx0PBfPOqmH4duaqVkl5/Sy63r3XCp37Uj+vabqckTUi8ZGTGAIy29voyqli8q2
A4OhUac05xLKyf+1aHVryb93R3LeoIMUC2dmsWyxE9QVoLFu7tUyRdzbRtEPD2Zm
6pWdNv/LCgdeIy0W/bIE+wA0flaFHAE4nGkfLC6RAoGABSnk6O3BGhE2Vhr9jDgt
aqLxHPd1ek0zjI3s4ohSqK957AtLyHSrx6PZWyWMMh1UuiMO8ziRKHZxNF0CfmAa
FGCcFVRnsohn3tPhPS8x+wm4/XUjZC/GeC3pj0FelVJWWV3DQjbOySUzoxCQPWcb
QLMb24MhjOPqIBSl6O+pJ5g=
-----END PRIVATE KEY-----"

          const publicSSLCert = "-----BEGIN CERTIFICATE-----
MIIC+DCCAeCgAwIBAgIUE1r0vG7FUdoviVO0e/3Q1NXIoQ0wDQYJKoZIhvcNAQEL
BQAwIzEhMB8GA1UEAwwYMTItMDYtYmFja2VuZC52ZXJjZWwuYXBwMB4XDTI0MDYx
MjE3NTkyMloXDTI1MDYxMjE3NTkyMlowIzEhMB8GA1UEAwwYMTItMDYtYmFja2Vu
ZC52ZXJjZWwuYXBwMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsIjQ
mtbHTjP/P7lz/fBTKw1d0tgwUmDpSJQcG1HMXPk7Yc76liM7bfoUKBOcUSgyyRgT
EPvVB3XINn8nWmK/fvhIFF2Z3qP56PKvmj5saLyPAoBb1L9OnUxfEUW2fJPs2p4O
impflNtqvqcmG45c5vnXsjK91xHbdtMrK0MoxxwHda8Fje6mxzm7LYKEvWa1R6rL
DL53pMpDtLy4vlKjZF9lEFq7cywdPM+9JIrfB3zCkr3E/q4zrntlmiOpZKghapvy
Xt9OLrYGOJeYbBnzT8MLOG+l33scOMt+yA4C6FDnSSK6EB4CXoZ04Ohluw9qgUdp
7wKqMu8fs2OebnrK2QIDAQABoyQwIjALBgNVHQ8EBAMCBDAwEwYDVR0lBAwwCgYI
KwYBBQUHAwEwDQYJKoZIhvcNAQELBQADggEBADMkMj4YTHri6J+M2g3okSsfourd
y1c1rWvro1YChScx1oXpLyKuCWwMQ/gxZZlGi/StdGt8Jd1w6KXH4m0ZoukK+Cih
vKfNE2kO/8UuYJa3DO2VHN8Xk0CrsSj47Vl5REAok8nG0pNPVY4qoTx1N0yzKLyu
hRhIXHDj8HMd6sl2omLGaZsAx25mppBNgCsJTOomf6zZ9ZYl6ogYZZTtl+cujdud
DnL4UiJDkJwNFduEWkrbkzY9BOI/SeqJ5KKpKP254OCe+EJSL7REknJyQatzy87u
zht8G79g9qzpdbNU1OmvXi651yyc2dKQ6+U5lZP71+8eji9iWvZwl/jx9wc=
-----END CERTIFICATE-----"

            const httpsServer = https.createServer({key: privateKey, cert: publicSSLCert}, app);
            const HTTPS_PORT = parseInt(process.env.HTTPS_PORT!);
            httpsServer.listen(HTTPS_PORT, () => {
                console.log(`Listening for HTTPS at https://localhost:${HTTPS_PORT}`);
                
            })
        } else {
            const port = process.env.HTTP_PORT ? parseInt(process.env.HTTP_PORT) : 3000;
            const httpServer = http.createServer(app);
            startWebSocketConnection(httpServer);
            httpServer.listen(port, () => {
                logger.info(`Listening for HTTP at http://localhost:${port}`);
            });
        }
    } else {
      try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        console.log("Connection successfully etablished!");
        // Send a ping to confirm a successful connection
        await client.db("BitBusters").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
      } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
      }
    }
};

setup().catch(console.dir);





