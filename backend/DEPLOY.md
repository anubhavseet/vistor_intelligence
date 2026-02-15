# Auto-Deployment Setup Guide

This guide explains how to use the `deploy-webhook.js` script to automatically update and restart your backend server when you push code to GitHub.

## Prerequisites
- Node.js installed on your server (spare laptop).
- Code cloned from GitHub.
- Port `3001` (or your configured port) exposed to the internet.

## Configuration

1.  **Set Environment Variables**:
    Create or update your `.env` file in `tracker/backend` with the following:
    ```env
    PORT=3001
    DEPLOY_SECRET=your_super_secure_secret_here
    ```
    *Replace `your_super_secure_secret_here` with a strong random string.*

## Starting the Server

Instead of running `npm run start:prod` directly, use the deployment script:

```bash
npm run deploy:webhook
```

This will:
1.  Start your application (`npm run start:prod`).
2.  Start a Webhook listener on port `3001`.

## GitHub Setup

1.  Go to your repository on GitHub.
2.  Navigate to **Settings** > **Webhooks**.
3.  Click **Add webhook**.
4.  **Payload URL**: `http://<your-server-ip>:3001/webhook`
    *   *Note: If your laptop is behind a router, you may need to set up Port Forwarding or use a tool like [ngrok](https://ngrok.com/) (`ngrok http 3001`).*
5.  **Content type**: `application/json`.
6.  **Secret**: Enter the exact same string you used for `DEPLOY_SECRET`.
7.  **Which events would you like to trigger this webhook?**: Select **Just the push event**.
8.  Click **Add webhook**.

## Testing

1.  Push a change to the `master` branch.
2.  Check the server logs. You should see:
    ```
    Push received for master. Triggering update.
    --- Starting Update Process ---
    Stopping application...
    > git pull
    ...
    > npm install
    ...
    > npm run build
    ...
    --- Update Complete ---
    Starting application...
    ```
