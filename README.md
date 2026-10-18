# SITEZO — MERN website

## Run locally
1. Install Node 18+ and MongoDB Community Server (or use a free MongoDB Atlas cluster).
2. `copy server\.env.example server\.env` (first time only) and fill in the values.
3. `npm run install:all`
4. `npm run dev` → client http://localhost:5173, API http://localhost:5000
5. Check the API: http://localhost:5000/api/health
6. Backend tests: `npm test --prefix server`

Self-hosted production: `npm run build` then `npm start` (Express serves `client/dist`).
Vercel deployment: see **Deploy to Vercel** below.

## Email notifications (Gmail)
Every enquiry is saved to MongoDB first. Then an email is sent to you. If email is not set up, or
Gmail is unreachable, the enquiry is **still saved** and the visitor still sees success; the problem
is written to the backend terminal.

### 1. Turn on 2-Step Verification
1. Go to https://myaccount.google.com and sign in with the Gmail account that will send the emails.
2. Open **Security** → **2-Step Verification** → **Get started** and finish the setup. (App Passwords only appear once this is on.)

### 2. Create an App Password
1. Go to https://myaccount.google.com/apppasswords (or search "App passwords" in your Google Account).
2. Enter a name such as `SITEZO website` and click **Create**.
3. Google shows a 16-letter password (e.g. `abcd efgh ijkl mnop`). Copy it now; it is shown only once.
   Do not share it with anyone, including in chats.

If the App Passwords page is missing, 2-Step Verification is off, or your Workspace admin has disabled it.

### 3. Put the details in `server/.env`
Open `server/.env` (create it from `.env.example` if needed) and set:
```
MAIL_USER=your-gmail-address@gmail.com
MAIL_PASS=abcdefghijklmnop
NOTIFICATION_EMAIL=
```
- `MAIL_USER` is the Gmail address that sends the email.
- `MAIL_PASS` is the App Password (spaces are optional), never your normal Gmail password.
- `NOTIFICATION_EMAIL` is optional: the inbox that receives enquiries. Leave blank to use `MAIL_USER`.
- Never commit `.env`; it is already in `.gitignore`.

### 4. Restart the backend
Changes to `.env` are only read at startup. In the terminal running `npm run dev`, press `Ctrl + C`, then run
`npm run dev` again. The backend log should show:
```
Email notifications: configured (from you@gmail.com, to you@gmail.com). Checking Gmail login...
Email notifications: Gmail login verified.
```
"Login verified" only means Gmail accepted the credentials. It does not prove an email was delivered.
If you see `NOT configured (...)` it lists exactly which variable is missing. If you see
`Gmail login check FAILED`, re-check the App Password and 2-Step Verification.

### 5. Test it
1. Open http://localhost:5173/contact and submit the form with your real details.
2. Expected: the page says "Thank you! Your enquiry has been received…".
3. The terminal shows `EMAIL notification sent for enquiry <id>.`
4. Check the inbox of `NOTIFICATION_EMAIL` (or `MAIL_USER`), and the Spam folder the first time.
   The subject is `New SITEZO Project Enquiry — <name>`. Pressing Reply writes to the customer.
5. The enquiry should also appear in MongoDB: database `sitezo`, collection `enquiries`.

## SMS notifications (disabled)
SMS is switched **off**. The Twilio code is still in the project but only runs when
`SMS_NOTIFICATIONS_ENABLED=true` *and* all four Twilio variables are set. You do not need any Twilio
value anywhere. The customer's phone number is still collected, validated, saved and included in the email.

## Deploy to Vercel (frontend + API on one domain)
How it fits together: Vercel builds `client/` and serves `client/dist`; every `/api/*` request is routed
to `api/index.js`, which runs the same Express app (`server/app.js`) as a serverless function.

### 1. MongoDB Atlas (the cloud database)
1. Create a free account and a free **M0** cluster at https://www.mongodb.com/cloud/atlas.
2. **Database Access** -> *Add New Database User* -> username + a strong password (use letters and
   digits only, or URL-encode special characters) with the *Read and write to any database* role.
3. **Network Access** -> *Add IP Address* -> **Allow access from anywhere** (`0.0.0.0/0`). Vercel does not
   use fixed IP addresses, so this is required; the database user's password is what protects it.
4. **Database** -> *Connect* -> *Drivers* -> copy the connection string and add the database name `sitezo`:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/sitezo?retryWrites=true&w=majority`
5. The `enquiries` collection is created automatically on the first submission. Enquiries already in
   your local MongoDB are not copied automatically.

### 2. Push to GitHub
```
cd sitezo
git init
git add .
git status
git commit -m "SITEZO website"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/sitezo.git
git push -u origin main
```
Before committing, `git status` must NOT list any `.env` file (only `server/.env.example`). If one appears,
stop and run `git rm --cached server/.env` first. Create the empty repository on github.com first.

### 3. Deploy on Vercel
1. https://vercel.com -> *Add New* -> *Project* -> import the GitHub repository. Leave **Root Directory**
   as the repository root. `vercel.json` already sets the install/build commands and output folder.
2. Open **Environment Variables** and add these (apply to Production, Preview and Development):

| Name | Value |
|---|---|
| `MONGO_URI` | your Atlas connection string (with `/sitezo`) |
| `MAIL_USER` | Gmail address that sends the emails |
| `MAIL_PASS` | Gmail App Password (16 letters) |
| `NOTIFICATION_EMAIL` | inbox that receives enquiries (blank = `MAIL_USER`) |
| `SMS_NOTIFICATIONS_ENABLED` | `false` (optional; SMS is off by default) |

   `CLIENT_URL` and all `TWILIO_*` / `OWNER_PHONE_NUMBER` variables are **not** needed on Vercel.
3. Click **Deploy**. Environment variables are only read at deploy time, so after changing any of
   them use *Deployments* -> *Redeploy*.

### 4. Test production (replace the domain with yours)
1. Open `https://YOUR-PROJECT.vercel.app/api/health` -> `{"success":true,"message":"SITEZO API is running"}`.
2. Open `/services`, `/about`, `/work`, `/faq`, `/contact` directly and refresh each: they must load.
3. On `/contact`, submit a real test enquiry including a phone number -> the thank-you message appears.
4. Atlas -> *Database* -> *Browse Collections* -> `sitezo` -> `enquiries`: the new document is there.
5. Check the `NOTIFICATION_EMAIL` inbox (and Spam). The email lists name, email, phone, business, service,
   budget, message and time.
6. If something fails: Vercel -> project -> *Logs* shows the server messages, for example
   `MongoDB connection failed` (check `MONGO_URI`, the Atlas user and Network Access) or
   `EMAIL notification FAILED` (check the App Password). A failed email never loses the saved enquiry.

Notes: the 10-enquiries-per-15-minutes limit is kept per serverless instance, so it is only a light
safeguard. The Vercel function allows up to 30 seconds, enough for saving plus sending the email.
