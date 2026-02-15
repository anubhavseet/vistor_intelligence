const http = require('http');
const crypto = require('crypto');
const { spawn, execSync } = require('child_process');
const path = require('path');

// Configuration
const PORT = process.env.PORT || 3001;
const SECRET = process.env.DEPLOY_SECRET || 'your-secret-token'; // Change this!
const BRANCH = 'master';
const SIG_HEADER_NAME = 'x-hub-signature-256';
const SIG_HASH_ALG = 'sha256';

// State
let appProcess = null;
let isUpdating = false;

// Helper: Start the application
function startApp() {
    if (appProcess) return;

    console.log('Starting application...');
    // Adjust the command if needed (e.g., 'npm start' vs 'npm run start:prod')
    appProcess = spawn('npm', ['run', 'start:prod'], {
        stdio: 'inherit',
        shell: true,
        cwd: path.resolve(__dirname, '..')
    });

    appProcess.on('close', (code) => {
        console.log(`Application exited with code ${code}`);
        appProcess = null;
        // Optional: Auto-restart if it crashes unexpectedy and NOT updating
        if (!isUpdating && code !== 0) {
            console.log('Restarting application in 5s...');
            setTimeout(startApp, 5000);
        }
    });

    appProcess.on('error', (err) => {
        console.error('Failed to start application:', err);
    });
}

// Helper: Stop the application
function stopApp() {
    if (appProcess) {
        console.log('Stopping application...');
        // On Windows, tree kill is often needed for shell spawns
        if (process.platform === 'win32') {
            try {
                execSync(`taskkill /pid ${appProcess.pid} /T /F`);
            } catch (e) {
                // Ignore if already dead
            }
        } else {
            process.kill(-appProcess.pid); // Kill process group
        }
        appProcess = null;
    }
}

// Helper: Update the code
function updateCode() {
    if (isUpdating) return;
    isUpdating = true;

    console.log('--- Starting Update Process ---');
    stopApp();

    try {
        const options = { stdio: 'inherit', cwd: path.resolve(__dirname, '..') };

        console.log('> git pull');
        execSync('git pull', options);

        console.log('> npm install');
        execSync('npm install', options);

        console.log('> npm run build');
        execSync('npm run build', options);

        console.log('--- Update Complete ---');
    } catch (error) {
        console.error('!!! Update Failed !!!', error);
    } finally {
        isUpdating = false;
        startApp();
    }
}

// Validation: Verify HMAC signature
function verifySignature(req, bodyBuffer) {
    if (!SECRET) return true; // No secret = no verification (not recommended)
    const sig = req.headers[SIG_HEADER_NAME];
    if (!sig) return false;

    const hmac = crypto.createHmac(SIG_HASH_ALG, SECRET);
    const digest = Buffer.from(SIG_HASH_ALG + '=' + hmac.update(bodyBuffer).digest('hex'), 'utf8');
    const checksum = Buffer.from(sig, 'utf8');

    if (checksum.length !== digest.length || !crypto.timingSafeEqual(digest, checksum)) {
        return false;
    }
    return true;
}

// Server
const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/webhook') {
        let chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', () => {
            const bodyBuffer = Buffer.concat(chunks);

            // 1. Verify Signature
            if (!verifySignature(req, bodyBuffer)) {
                console.error('Invalid signature');
                res.writeHead(401);
                res.end('Invalid signature');
                return;
            }

            // 2. Parse Payload
            let payload;
            try {
                payload = JSON.parse(bodyBuffer.toString());
            } catch (e) {
                console.error('Invalid JSON');
                res.writeHead(400);
                res.end('Invalid JSON');
                return;
            }

            // 3. Check Branch (push event)
            const ref = payload.ref;
            if (ref === `refs/heads/${BRANCH}`) {
                console.log(`Push received for ${BRANCH}. Triggering update.`);
                // Respond immediately, handle update async
                res.writeHead(200);
                res.end('Update triggered');

                // Trigger update
                setTimeout(updateCode, 1000);
            } else {
                console.log(`Push ignored for ref: ${ref}`);
                res.writeHead(200);
                res.end('Ignored');
            }
        });
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

// Start
console.log(`Deploy server listening on port ${PORT}`);
server.listen(PORT, () => {
    // Initial app start
    startApp();
});
