# Automated Daily Quote Email System (Wix + Brevo)

An automated backend and frontend system for Wix websites to dispatch daily inspirational quotes from a Wix CMS collection to subscribed contacts via the Brevo SMTP API, along with a frontend quotes history page.

---

## 📂 Project Architecture

- **`subscribers.jsw`**: Wix CRM interface. Handles paginated querying of site contacts and filters for active promotional email subscribers.
- **`brevo.web.js`**: Core backend logic engine. Fetches the quote matching the current date, groups subscribers, formats a premium HTML template, and dispatches individual API requests.
- **`testbrevo.web.js`**: Functional testing harness. Exposes a one-click `testSendEmail` web method to test the API integration to a single email address.
- **`jobs.config`**: Wix Job Scheduler configuration. Runs the job automatically at 8:00 AM IST (2:30 AM UTC) daily.
- **`quotePage.js`**: Frontend Velo code for the daily quotes archive page. Queries the CMS and binds past/today's quotes to a repeater while hiding future scheduled quotes.
- **`events/events.js`**: Frontend routing code for the main Events page. Maps `#annual`, `#special`, and `#misc` container clicks to their respective page slugs.
- **`events/Annual.js`, `Special.js`, `Misc.js`**: Frontend code for category-specific event pages. Automatically filters the on-page dataset (`#dataset1`) so the connected repeater only shows events matching the correct `eventCategory`.

---

## 🛠️ Prerequisites & Credentials

1. **Brevo API Key**: Generate an API key from SMTP & API section in your Brevo Dashboard.
2. **Sender Domain**: Verify the sender email address (`quotes@cbsatpathy.com`) in your Brevo Account.
3. **Wix Secrets Manager**: Create a secret in Wix Secrets Manager with the name `BREVO_API_KEY` and paste your Brevo API key there.

---

## 🗄️ Wix CMS Database Schema (`DailyQuote`)

Ensure your collection ID is named exactly `DailyQuote` with the following field configurations:

| Field Name  | Field Key    | Field Type | Description                      |
| ----------- | ------------ | ---------- | -------------------------------- |
| Quote Text  | `quoteText`  | Text       | The content of the quote         |
| Author      | `author`     | Text       | Author of the quote              |
| Quote Date  | `quoteDate`  | Date       | Assigned date to display/send    |
| Quote Image | `quoteImage` | Image      | Optional background/header image |

---

## 🚀 Deployment Instructions

### Step 1: Copy Backend Modules
1. Place `subscribers.jsw`, `brevo.web.js`, and `testbrevo.web.js` inside your Wix site's **Backend** folder.
2. Place `jobs.config` in the **Backend** code section.

### Step 2: Create the Frontend Archive Page
1. Create a page on your site and add a **Repeater** (`#quoteRepeater`).
2. Add elements inside the repeater:
   - Text block for quote content (`#quoteText`)
   - Text block for author name (`#authorText`)
   - Text block for date (`#quoteDateText`)
   - Image box for background/header (`#quoteImage`)
3. Open the Page Code drawer and copy the contents of `quotePage.js` into it.

### Step 3: Run the Test Email
1. Open the backend file `testbrevo.web.js`.
2. Click the **Play button** (Run arrow) in the code editor gutter next to the `testSendEmail` declaration.
3. Verify that the test email delivers to `nomiking0072012@gmail.com` with the premium template layout and official logo.

### Step 4: Setup the Events Pages
1. On your main **Events** page, create three clickable containers with IDs `#annual`, `#special`, and `#misc`. Paste the code from `events/events.js` to handle navigation.
2. For the three event category pages (Annual, Special, and Misc), ensure you have a Dataset on the page with the ID `#dataset1` and a Repeater connected to it via the CMS connection panel.
3. Paste the code from `events/Annual.js`, `events/Special.js`, and `events/Misc.js` into their respective page code panels to automatically filter the dataset for the correct `eventCategory`.
