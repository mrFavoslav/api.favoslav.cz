const express = require('express');
const router = express.Router();
const fs = require('fs');
const {clientId, clientSecret, port} = require('/home/api/config.json');
require("dotenv").config({ path: '/home/api/.env' });

router.get('/', async (req, res) => {
    console.log(`[BOApi] Received GET request for personal info`);
    
    const birthDate = new Date(process.env.BIRTH);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    const personalInfo = {
        name: "Ondřej",
        surname: "Chmelíček",
        age: age,
        currentTime: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    res.json(personalInfo);
});

module.exports = router;