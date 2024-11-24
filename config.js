const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}
module.exports = {
SESSION_ID: process.env.SESSION_ID,
ALIVE_IMG: process.env.ALIVE_IMG || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRhyWYx5_IFWOx3de2MtnBrwxK_r1gcNhwa6w&s",
ALIVE_MSG: process.env.ALIVE_MSG || "Hello. I am SL_PANCHA_MD ☠👋✅ whatsapp bot 💥 i am alive now!💖",
AUTO_READ_STATUS: process.env.AUTO_READ_STATUS || "false",
};
config.js
Displaying config.js.
