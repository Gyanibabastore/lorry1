const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');

async function sendPDF(to, filePath, templateNumber = null, originalMessage = '', truckNumber = null) {
  const adminNumber = process.env.ADMIN_NUMBER;
  
  try {
    console.log("📤 Sending PDF to:", to);

    // 📁 Generate a new file name using truck number
    const fileName = `${truckNumber || 'LR'}.pdf`;
    const renamedPath = path.join(__dirname, 'temp', fileName);

    // Ensure temp folder exists
    fs.mkdirSync(path.join(__dirname, 'temp'), { recursive: true });

    // Copy original file with new name
    fs.copyFileSync(filePath, renamedPath);

    // Upload
    const form = new FormData();
    form.append('file', fs.createReadStream(renamedPath));
    form.append('type', 'application/pdf');
    form.append('messaging_product', 'whatsapp');

    const uploadRes = await axios.post(
      `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/media`,
      form,
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          ...form.getHeaders(),
        },
      }
    );

    const mediaId = uploadRes.data.id;
    console.log("📎 Media uploaded. ID:", mediaId);

    // Send to user
    await axios.post(
      `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "document",
        document: {
          id: mediaId,
          caption: `\nDate: ${new Date().toLocaleDateString()}`,
          filename: fileName,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log("✅ PDF sent to user:", to);

    // ✅ Notify admin of success
  if (adminNumber) {
  await axios.post(
    `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to: adminNumber,
      type: "document",
      document: {
        id: mediaId,
        caption: `📄 Rudransh Trading LR\nTemplate: ${templateNumber}\n Mobile: ${to}\nDate: ${new Date().toLocaleDateString()}\n\n📝 ${originalMessage}`,
        filename: fileName,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );
}

const user=[
  "918103061906",
  "918983641826"
]

for (const number of user) {
  await axios.post(
    `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to: number,
      type: "document",
      document: {
        id: mediaId,
        caption: `📄 Rudransh Trading LR
Template: ${templateNumber}
Mobile: ${to}
Date: ${new Date().toLocaleDateString()}

📝 ${originalMessage}`,
        filename: fileName,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );
}

    // 🧹 Cleanup renamed file
    // 🧹 Cleanup renamed file (temp)
fs.unlinkSync(renamedPath);

// 🧹 DELETE the original generated PDF
try {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log("🗑️ Deleted original generated PDF:", filePath);
  }
} catch (err) {
  console.error("❌ Error deleting original PDF:", err.message);
}


  } catch (err) {
    const errorMessage = err.response?.data?.error?.message || err.message;
    console.error("❌ Error sending PDF:", errorMessage);

    if (adminNumber) {
      const failMsg = `❌ *PDF failed to send*\nTo: ${to}\nReason: ${errorMessage}\n\n📝 ${originalMessage}`;
      await axios.post(
        `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: "whatsapp",
          to: adminNumber,
          text: { body: failMsg },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );
    }
  }
}

module.exports = sendPDF;
