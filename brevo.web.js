import wixData from 'wix-data';
import { getSecret } from 'wix-secrets-backend';
import { fetch } from 'wix-fetch';
import { getVerifiedSubscribers } from 'backend/subcribers';
import { Permissions, webMethod } from 'wix-web-module';

export const sendDailyQuoteJob = webMethod(Permissions.Anyone, async () => {
    try {
        // Get current date in IST (UTC+5:30) as the target timezone
        const tzOffset = 5.5 * 60 * 60 * 1000;
        const todayIST = new Date(Date.now() + tzOffset);
        
        const year = todayIST.getUTCFullYear();
        const month = String(todayIST.getUTCMonth() + 1).padStart(2, '0');
        const day = String(todayIST.getUTCDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        const startOfDay = new Date(Date.UTC(todayIST.getUTCFullYear(), todayIST.getUTCMonth(), todayIST.getUTCDate(), 0, 0, 0, 0) - tzOffset);
        const endOfDay = new Date(Date.UTC(todayIST.getUTCFullYear(), todayIST.getUTCMonth(), todayIST.getUTCDate(), 23, 59, 59, 999) - tzOffset);

        const queryResult = await wixData.query("DailyQuote")
            .eq("quoteDate", todayStr)
            .or(
                wixData.query("DailyQuote")
                    .ge("quoteDate", startOfDay)
                    .le("quoteDate", endOfDay)
            )
            .find();

        if (queryResult.items.length === 0) {
            console.log("No quote matching today's date found in the CMS. Skipping email dispatch.");
            return;
        }

        const quoteItem = queryResult.items[0];
        const quoteText = quoteItem.quoteText;
        const author = quoteItem.author || "Unknown";
        const quoteImage = quoteItem.quoteImage;
        const title = quoteItem.title || "";
        const quoteDate = quoteItem.quoteDate;

        const subscribers = await getVerifiedSubscribers();
        if (!subscribers || subscribers.length === 0) {
            return;
        }

        const brevoApiKey = await getSecret("BREVO_API_KEY");
        if (!brevoApiKey) {
            throw new Error("BREVO_API_KEY is not defined in Wix Secrets Manager.");
        }

        const dateString = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const subject = `Quote of the Day | ${dateString}`;

        const htmlContent = buildEmailTemplate(quoteText, author, quoteImage, title, quoteDate);
        const batchSize = 10;
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < subscribers.length; i += batchSize) {
            const batch = subscribers.slice(i, i + batchSize);
            const sendPromises = batch.map(email => sendSingleEmail(brevoApiKey, email, subject, htmlContent));
            const results = await Promise.all(sendPromises);

            results.forEach(res => {
                if (res.success) {
                    successCount++;
                } else {
                    failCount++;
                }
            });
        }
    } catch (error) {
        console.error(error.message);
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

function buildEmailTemplate(quoteText, author, quoteImage, title, quoteDate) {
    const targetDate = quoteDate ? new Date(quoteDate) : new Date();
    const day = targetDate.getDate();
    const month = targetDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();

    const encodedQuote = encodeURIComponent(`“${quoteText}” — ${author}`);
    const encodedUrl = encodeURIComponent("https://www.cbsatpathy.com");

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
                <img src="${imageUrl}" alt="Inspirational Image" oncontextmenu="return false;" ondragstart="return false;" style="width: 100%; max-width: 100%; height: auto; display: block; border: 0; pointer-events: none; -webkit-user-drag: none; -webkit-touch-callout: none; -webkit-user-select: none; user-select: none;" />
                <div style="margin-top: -45px; position: relative; padding-bottom: 20px;">
                    <table class="quote-card" align="center" role="presentation" width="100%" style="border-collapse: collapse;">
                        <tr>
                            <td style="padding: 40px 50px;">
                                <div class="quote-mark">“</div>
                                <div class="quote-text">${quoteText}</div>
                                <div class="quote-author">${author}</div>
                                
                                <!-- Social Sharing -->
                                <div class="share-section">
                                    <span class="share-title">Share this Quote</span>
                                    <a href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}" target="_blank" class="share-btn">Facebook</a>
                                    <a href="https://twitter.com/intent/tweet?text=${encodedQuote}&url=${encodedUrl}" target="_blank" class="share-btn">X</a>
                                    <a href="https://api.whatsapp.com/send?text=${encodedQuote}%20${encodedUrl}" target="_blank" class="share-btn">WhatsApp</a>
                                    <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}" target="_blank" class="share-btn">LinkedIn</a>
                                </div>
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

                            <!-- Social Sharing -->
                            <div class="share-section">
                                <span class="share-title">Share this Quote</span>
                                <a href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}" target="_blank" class="share-btn">Facebook</a>
                                <a href="https://twitter.com/intent/tweet?text=${encodedQuote}&url=${encodedUrl}" target="_blank" class="share-btn">X</a>
                                <a href="https://api.whatsapp.com/send?text=${encodedQuote}%20${encodedUrl}" target="_blank" class="share-btn">WhatsApp</a>
                                <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}" target="_blank" class="share-btn">LinkedIn</a>
                            </div>
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
                box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.06), 0 10px 30px rgba(0, 0, 0, 0.08);
                text-align: center;
                position: relative;
                border-radius: 8px;
                overflow: hidden;
            }
            .quote-mark {
                font-family: 'Playfair Display', Georgia, serif;
                font-size: 64px;
                color: #cbd5e1;
                line-height: 1;
                margin-bottom: 5px;
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
                margin-bottom: 10px;
            }
            .share-section {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #edf2f7;
                text-align: center;
            }
            .share-title {
                font-size: 11px;
                color: #a0aec0;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                display: block;
                margin-bottom: 12px;
                font-weight: 700;
            }
            .share-btn {
                display: inline-block;
                margin: 4px 6px;
                padding: 6px 12px;
                background-color: #ffffff;
                color: #C2002F;
                text-decoration: none;
                border: 1px solid #C2002F;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 700;
                font-family: 'Plus Jakarta Sans', sans-serif;
                letter-spacing: 0.5px;
                transition: all 0.2s ease;
            }
            .footer {
                text-align: center;
                font-size: 12px;
                color: #718096;
                line-height: 1.2;
                padding: 24px 20px 20px;
            }
            .footer p {
                margin: 4px 0;
            }
            .footer a {
                color: #C2002F;
                text-decoration: none;
                font-weight: 600;
            }
            .social-icons-container {
                margin: 20px 0;
            }
            .social-icon-link {
                display: inline-block;
                margin: 0 8px;
                text-decoration: none;
                vertical-align: middle;
            }
            .social-icon-img {
                border: 0;
                display: block;
                width: 28px;
                height: 28px;
            }
            .unsubscribe-btn {
                display: inline-block;
                margin-top: 15px;
                padding: 8px 18px;
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
                        
                        <div class="social-icons-container">
                            <p style="margin-bottom: 12px; color: #718096; font-size: 13px; font-weight: 600; letter-spacing: 0.5px;">Follow Dr. Chandra Bhanu Satpathy:</p>
                            <a href="https://www.facebook.com/chandrabhanusatpathyofficial" target="_blank" class="social-icon-link">
                                <img src="https://img.icons8.com/ios-filled/28/C2002F/facebook-new.png" alt="Facebook" class="social-icon-img" />
                            </a>
                            <a href="https://x.com/TheOfficeofCBS" target="_blank" class="social-icon-link">
                                <img src="https://img.icons8.com/ios-filled/28/C2002F/twitterx.png" alt="X" class="social-icon-img" />
                            </a>
                            <a href="https://www.instagram.com/chandrabhanusatpathyofficial/" target="_blank" class="social-icon-link">
                                <img src="https://img.icons8.com/ios-filled/28/C2002F/instagram-new.png" alt="Instagram" class="social-icon-img" />
                            </a>
                            <a href="https://www.youtube.com/@chandrabhanusatpathy" target="_blank" class="social-icon-link">
                                <img src="https://img.icons8.com/ios-filled/28/C2002F/youtube-play.png" alt="YouTube" class="social-icon-img" />
                            </a>
                            <a href="https://open.spotify.com/artist/4b6TSj8Zw0rDF9idAX9OF7?si=P4lic_zURm2vLBhHf2Vp0g&nd=1&dlsi=550db7cc25fa4855" target="_blank" class="social-icon-link">
                                <img src="https://img.icons8.com/ios-filled/28/C2002F/spotify.png" alt="Spotify" class="social-icon-img" />
                            </a>
                        </div>

                        <p style="margin-top: 15px;"><strong>CBS Office</strong></p>
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
