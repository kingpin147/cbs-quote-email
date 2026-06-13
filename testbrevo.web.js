import wixData from 'wix-data';
import { getSecret } from 'wix-secrets-backend';
import { fetch } from 'wix-fetch';
import { Permissions, webMethod } from 'wix-web-module';

export const testSendEmail = webMethod(Permissions.Anyone, async () => {
    try {
        const queryResult = await wixData.query("DailyQuote")
            .limit(1)
            .find();

        let quoteText = "This is a test daily quote from the CMS.";
        let author = "Test Author";
        let quoteImage = "https://placehold.co/600x400@3x.png";

        if (queryResult.items.length > 0) {
            const quoteItem = queryResult.items[0];
            quoteText = quoteItem.quoteText || quoteText;
            author = quoteItem.author || author;
            quoteImage = quoteItem.quoteImage || quoteImage;
        }

        const brevoApiKey = await getSecret("BREVO_API_KEY");
        if (!brevoApiKey) {
            throw new Error("BREVO_API_KEY is not defined in Wix Secrets Manager.");
        }

        const dateString = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const subject = `Daily Quote - ${dateString}`;

        const htmlContent = buildEmailTemplate(quoteText, author, quoteImage);
        const result = await sendSingleEmail(brevoApiKey, "nomiking0072012@gmail.com", subject, htmlContent);
        
        console.log("Test execution result:", result);
        return result;
    } catch (error) {
        console.error("Test function failed:", error.message);
        return { success: false, error: error.message };
    }
});

async function sendSingleEmail(apiKey, recipientEmail, subject, htmlContent) {
    const url = "https://api.brevo.com/v3/smtp/email";
    const payload = {
        "sender": { 
            "name": "CBS Office", 
            "email": "quotes@cbsatpathy.com" 
        },
        "to": [{ 
            "email": recipientEmail 
        }],
        "subject": subject,
        "htmlContent": htmlContent
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            return { email: recipientEmail, success: true };
        } else {
            const errorText = await response.text();
            return { email: recipientEmail, success: false, error: errorText };
        }
    } catch (err) {
        return { email: recipientEmail, success: false, error: err.message };
    }
}

function buildEmailTemplate(quoteText, author, quoteImage) {
    let imageHtml = '';
    if (quoteImage) {
        if (quoteImage.startsWith('http://') || quoteImage.startsWith('https://')) {
            imageHtml = `
            <div style="margin-bottom: 25px; text-align: center;">
                <img src="${quoteImage}" alt="Inspirational Image" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);" />
            </div>`;
        }
    }

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Daily Inspirational Quote</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Plus+Jakarta+Sans:wght@300;400;500&display=swap');
            body {
                margin: 0;
                padding: 0;
                background-color: #f4f6f8;
                font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                -webkit-font-smoothing: antialiased;
            }
            .wrapper {
                width: 100%;
                table-layout: fixed;
                background-color: #f4f6f8;
                padding-top: 40px;
                padding-bottom: 40px;
            }
            .main-table {
                background-color: #ffffff;
                margin: 0 auto;
                width: 100%;
                max-width: 600px;
                border-spacing: 0;
                font-family: sans-serif;
                color: #2d3748;
                border-radius: 16px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
                overflow: hidden;
                border: 1px solid #e2e8f0;
            }
            .content-container {
                padding: 40px 35px;
            }
            .quote-mark {
                font-family: 'Playfair Display', Georgia, serif;
                font-size: 72px;
                color: #cbd5e1;
                line-height: 10px;
                height: 30px;
                margin-top: 10px;
            }
            .quote-text {
                font-family: 'Playfair Display', Georgia, serif;
                font-size: 24px;
                line-height: 1.6;
                color: #1a202c;
                font-style: italic;
                margin-bottom: 20px;
                font-weight: 500;
            }
            .quote-author {
                font-family: 'Plus Jakarta Sans', sans-serif;
                font-size: 15px;
                font-weight: 500;
                color: #64748b;
                letter-spacing: 1.5px;
                text-transform: uppercase;
                margin-bottom: 30px;
            }
            .divider {
                height: 1px;
                background-color: #e2e8f0;
                margin: 30px 0;
            }
            .footer {
                text-align: center;
                font-size: 12px;
                color: #94a3b8;
                line-height: 1.5;
            }
            .footer a {
                color: #64748b;
                text-decoration: underline;
            }
        </style>
    </head>
    <body>
        <center class="wrapper">
            <table class="main-table" role="presentation">
                <tr>
                    <td class="content-container">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <img src="https://static.wixstatic.com/media/c5af70_442591f3e5a64080931c0b02a8ee0177~mv2.jpeg" alt="CBS Office Logo" style="max-height: 80px; width: auto;" />
                        </div>
                        ${imageHtml}
                        <div class="quote-text">
                            ${quoteText}
                        </div>
                        <div class="quote-author">
                            &mdash; ${author}
                        </div>
                        <div class="divider"></div>
                        <div class="footer">
                            <p>Sent with love from <strong>CBS Office</strong></p>
                            <p>You are receiving this because you subscribed to our daily inspirational mailing list.</p>
                            <p>&copy; ${new Date().getFullYear()} CBS Office. All rights reserved.</p>
                            <span style="display:none !important; font-size:1px; color:#ffffff; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden;">${Date.now()}</span>
                        </div>
                    </td>
                </tr>
            </table>
        </center>
    </body>
    </html>
    `;
}
