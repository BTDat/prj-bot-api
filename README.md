### Getting started

#### Prerequisite
- Node.js LTS version
- Postgres latest version is installed
- Postgres database account is created
- SMTP email settings (using Sendgrid, Mailgun, ...) in case you want to test sending email

#### Run on localhost
Step 1: Copy `example.env` to a new file name `.env`, change host and DB information if you want.

Step 2: Migrate database schemas for first time running or after changing models.
```bash
npm run migrate
```

Step 3: Run server
```bash
npm install
npm run dev
```
