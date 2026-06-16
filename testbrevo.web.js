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
        let quoteImage = "https://picsum.photos/200/300";

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
        const subject = `Quote of the Day | ${dateString}`;

        const htmlContent = buildEmailTemplate(quoteText, author, quoteImage);
        const testEmails = ["nomiking0072012@gmail.com", "asima.panda047@gmail.com", "satpathy.abhishek@gmail.com", "Bubu.abhi@gmail.com"];
        const sendPromises = testEmails.map(email => sendSingleEmail(brevoApiKey, email, subject, htmlContent));
        const result = await Promise.all(sendPromises);
        
        // Log successful execution to JobLogs collection
        await wixData.insert('JobLogs', {
          jobName: 'testSendEmail',
          status: 'success',
          timestamp: new Date(),
          details: JSON.stringify({ result })
        });
        console.log("Test execution result:", result);
        return result;
    } catch (error) {
        console.error("Test function failed:", error.message);
        // Log error execution to JobLogs collection
        await wixData.insert('JobLogs', {
          jobName: 'testSendEmail',
          status: 'error',
          timestamp: new Date(),
          errorMessage: error.message
        });
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
        "to": [{ "email": recipientEmail }],
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
    const targetDate = new Date();
    const day = targetDate.getDate();
    const month = targetDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();

    let imageAndCardHtml;
    let imageUrl = '';
    if (quoteImage) {
        imageUrl = quoteImage;
        // Convert Wix media URLs (wix:image://v1/filename/...) to usable static URLs
        if (quoteImage.startsWith('wix:image://v1/')) {
            const parts = quoteImage.replace('wix:image://v1/', '').split('/');
            imageUrl = 'https://static.wixstatic.com/media/' + parts[0];
        }
        if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
            imageUrl = '';
        }
    }

    if (imageUrl) {
        // Image + quote card in same cell so negative margin overlap works
        imageAndCardHtml = `
        <tr>
            <td style="padding: 0; background-color: #eae7e1;">
                <img src="${imageUrl}" alt="Inspirational Image" style="width: 100%; max-width: 100%; height: auto; display: block; border: 0;" />
                <div style="margin-top: -45px; position: relative; padding-bottom: 20px;">
                    <table class="quote-card" align="center" role="presentation" width="100%" style="border-collapse: collapse;">
                        <tr>
                            <td style="padding: 40px 50px;">
                                <div class="quote-mark">“</div>
                                <div class="quote-text">${quoteText}</div>
                                <div class="quote-author">${author}</div>
                            </td>
                        </tr>
                    </table>
                </div>
            </td>
        </tr>`;
    } else {
        // No image — just the quote card standalone
        imageAndCardHtml = `
        <tr>
            <td class="quote-container" style="padding-top: 30px; padding-bottom: 20px;">
                <table class="quote-card" align="center" role="presentation" width="100%" style="border-collapse: collapse;">
                    <tr>
                        <td style="padding: 40px 50px;">
                            <div class="quote-mark">“</div>
                            <div class="quote-text">${quoteText}</div>
                            <div class="quote-author">${author}</div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>`;
    }

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Daily Inspirational Quote</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
            body {
                margin: 0;
                padding: 0;
                background-color: #eae7e1;
                font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                -webkit-font-smoothing: antialiased;
            }
            .wrapper {
                width: 100%;
                table-layout: fixed;
                background-color: #eae7e1;
                padding-top: 20px;
                padding-bottom: 40px;
            }
            .main-table {
                background-color: #eae7e1;
                margin: 0 auto;
                width: 100%;
                max-width: 600px;
                border-spacing: 0;
                font-family: 'Plus Jakarta Sans', sans-serif;
                color: #2d3748;
            }
            .header-table {
                width: 100%;
                border-spacing: 0;
                background-color: #eae7e1;
            }
            .date-box {
                background-color: #C2002F;
                color: #ffffff;
                width: 80px;
                height: 80px;
                text-align: center;
                vertical-align: middle;
            }
            .date-day {
                font-size: 28px;
                font-weight: 700;
                line-height: 1;
                margin: 0;
            }
            .date-month {
                font-size: 13px;
                font-weight: 700;
                letter-spacing: 1.5px;
                margin: 2px 0 0 0;
            }
            .header-title {
                font-family: 'Playfair Display', Georgia, serif;
                font-size: 18px;
                font-weight: 600;
                color: #C2002F;
                padding-left: 20px;
                vertical-align: middle;
                text-align: left;
                background-color: #ffffff;
                height: 80px;
            }
            .quote-container {
                padding: 0 0 20px 0;
                background-color: #eae7e1;
            }
            .quote-card {
                background-color: #ffffff;
                box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(0, 0, 0, 0.06);
                text-align: center;
                position: relative;
            }
            .quote-mark {
                font-family: 'Playfair Display', Georgia, serif;
                font-size: 64px;
                color: #cbd5e1;
                line-height: 1;
                margin-bottom: 10px;
                height: 40px;
            }
            .quote-text {
                font-family: 'Playfair Display', Georgia, serif;
                font-size: 22px;
                line-height: 1.6;
                color: #1a202c;
                font-style: italic;
                margin-bottom: 25px;
                font-weight: 500;
            }
            .quote-author {
                font-family: 'Playfair Display', Georgia, serif;
                font-size: 24px;
                font-style: italic;
                color: #718096;
                margin-top: 15px;
            }
            .footer {
                text-align: center;
                font-size: 12px;
                color: #718096;
                line-height: 1.2;
                padding: 12px 20px 20px;
            }
            .footer p {
                margin: 4px 0;
            }
            .footer a {
                color: #C2002F;
                text-decoration: none;
                font-weight: 600;
            }
            .social-links {
                margin: 15px 0;
            }
            .social-links a {
                display: inline-block;
                margin: 0 5px;
                color: #C2002F;
                text-decoration: none;
                font-weight: 500;
            }
            .unsubscribe-btn {
                display: inline-block;
                margin-top: 15px;
                padding: 10px 20px;
                background-color: transparent;
                color: #C2002F;
                text-decoration: none;
                font-weight: 600;
                border: 1px solid #C2002F;
                border-radius: 4px;
            }
        </style>
    </head>
    <body>
        <center class="wrapper">
            <table class="main-table" role="presentation">
                <!-- Header -->
                <tr>
                    <td style="padding: 0;">
                        <table class="header-table" role="presentation">
                            <tr>
                                <td class="date-box">
                                    <div class="date-day">${day}</div>
                                    <div class="date-month">${month}</div>
                                </td>
                                <td class="header-title">
                                    <img src="https://static.wixstatic.com/media/c5af70_3a8c19002272469081362a8b839195be~mv2.png" alt="CBS Office Logo" style="max-height: 60px; width: auto; display: block;" />
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                
                <!-- Image + Quote Card (combined for overlap) -->
                ${imageAndCardHtml}

                <!-- Footer -->
                <tr>
                    <td class="footer">
                        <p>You are receiving this because you subscribed to our daily inspirational mailing list.</p>
                        <div class="social-links">
                            <p style="margin-bottom: 8px;">Follow Dr. Chandra Bhanu Satpathy on Social Media:</p>
                            <a href="https://www.facebook.com/chandrabhanusatpathyofficial" target="_blank">Facebook</a> &bull;
                            <a href="https://x.com/TheOfficeofCBS" target="_blank">X</a> &bull;
                            <a href="https://www.instagram.com/chandrabhanusatpathyofficial/" target="_blank">Instagram</a> &bull;
                            <a href="https://www.youtube.com/@chandrabhanusatpathy" target="_blank">YouTube</a> &bull;
                            <a href="https://open.spotify.com/artist/4b6TSj8Zw0rDF9idAX9OF7?si=P4lic_zURm2vLBhHf2Vp0g&nd=1&dlsi=550db7cc25fa4855" target="_blank">Spotify</a>
                        </div>
                        <p style="margin-top: 15px;"><strong>CBS Office</strong></p>
                        <p>C-209, Sushant Lok, Phase-1, Gurugram,</p>
                        <p>122018, Haryana, India</p>
                        <div style="margin: 20px 0;">
                            <a href="{{ unsubscribe }}" class="unsubscribe-btn">Unsubscribe</a>
                            <span style="margin: 0 10px;">|</span>
                            <a href="https://www.cbsatpathy.com" target="_blank" style="text-decoration: underline;">www.cbsatpathy.com</a>
                        </div>
                        <p>&reg; ${new Date().getFullYear()} CBS Office. All rights reserved.</p>
                        <span style="display:none !important; font-size:1px; color:#eae7e1; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden;">${Date.now()}</span>
                    </td>
                </tr>
            </table>
        </center>
    </body>
    </html>
    `;
}
