import fs from 'fs';
import path from 'path';

function search(dir: string, pattern: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            search(fullPath, pattern);
        } else if (file.endsWith('.ts') || file.endsWith('.js')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes(pattern)) {
                console.log(`Found in: ${fullPath}`);
            }
        }
    }
}

const pattern = "Seuls les administrateurs";
console.log(`Searching for "${pattern}" in BACKEND/src...`);
search('c:/Users/Toto/Downloads/visio-conf-25-main (2)/visio-conf-25-main/BACKEND/src', pattern);
console.log('Search finished.');
