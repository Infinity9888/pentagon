import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export class HashValidator {
    /**
     * Checks if a local file matches the expected hash (sha1).
     * If no hash is provided, checks if file exists and has size > 0.
     */
    static validate(filePath: string, expectedSha1?: string, expectedSize?: number): boolean {
        if (!fs.existsSync(filePath)) return false;

        const stat = fs.statSync(filePath);
        if (stat.size === 0) return false;

        if (expectedSize !== undefined && stat.size !== expectedSize) {
            return false;
        }

        if (expectedSha1) {
            const fileBuffer = fs.readFileSync(filePath);
            const hashSum = crypto.createHash('sha1');
            hashSum.update(fileBuffer);
            const actualSha1 = hashSum.digest('hex');

            return actualSha1.toLowerCase() === expectedSha1.toLowerCase();
        }

        return true;
    }
}
