require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors');

app.use(express.json({
    verify: (req, res, buf) => {
        const url = req.originalUrl
        if (url.startsWith("/webhooks")) {
            req.rawBody = buf.toString()
        }
    }
}))

app.use(cors())

var coinbase = require('coinbase-commerce-node');
var Client = coinbase.Client;
var resources = coinbase.resources
var Webhook = coinbase.Webhook

Client.init("bd7252b1-742e-4ebd-aee6-a1aacdc74ae5");

app.get("/", async (req, res) => {
    res.send("Crypto Api")
})

app.post("/checkout", async (req, res) => {
    const { orderid, name, description, amount, itemid, userid, fullName, email, phone, address1, address2, country, city, postalCode, info } = req.body;

    try {
        const charge = await resources.Charge.create({
            name: name,
            description: description,
            local_price: {
                amount: amount,
                currency: "USD",
            },
            pricing_type: "fixed_price",
            metadata: {
                orderid: orderid,
                itemid: itemid,
                userid: userid,
                fullName: fullName,
                email: email,
                phone: phone,
                address1: address1,
                address2: address2,
                country: country,
                city: city,
                postalCode: postalCode,
                info: info
            },
        })

        axios.post('https://bluntphramaapi.herokuapp.com/postOrder', ).then(res => {
            return res
        })

        const data = {
            orderid: orderid,
            userid: userid,
            itemid: itemid,
            total: amount,
            fullname: fullName,
            email: email,
            phoneno: phone,
            address1: address1,
            address2: address2,
            city: city,
            country: country,
            postalcode: postalCode,
            info: info,
            status: "pending",
        }

        try {
            const response = await fetch("https://bluntphramaapi.herokuapp.com/postOrder", {
                method: "POST", // or 'PUT'
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();
            console.log("Success:", result);
        } catch (error) {
            console.error("Error:", error);
        }


        res.status(200).json({
            charge: charge,
            url: charge.hosted_url
        })
    }
    catch (error) {
        res.status(500).json({
            error: error
        })
    }
})

app.post("/webhooks", async (req, res) => {
    const event = Webhook.verifyEventBody(
        req.rawBody,
        req.headers['x-cc-webhook-signature'],
        '6056c8e2-61cf-4426-b76d-3e8beda7a9ef'
    )

    if (event.type === "charge:confirmed") {
        let amount = event.data.pricing.local.amount;
        let currency = event.data.pricing.local.currency;
        let userid = event.data.metadata.userid;

        console.log(amount, currency, userid)
    }

    if (event.type === "charge:created") {
        console.log("created")
    }
    if (event.type === "charge:delayed") {
        console.log("delayed")
    }
    if (event.type === "charge:failed") {
        console.log("failed")
    }
    if (event.type === "charge:pending") {
        console.log("Pending")
    }

    if (event.type === "charge:resolved") {
        console.log("Resolved")
    }

})

app.listen(process.env.PORT || 5000, () => {
    console.log("Server listening")
})