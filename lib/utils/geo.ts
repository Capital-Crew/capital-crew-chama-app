
interface GeoResult {
    city: string;
    regionName: string;
    country: string;
    countryCode: string;
}

export async function getGeoFromIp(ip: string): Promise<string | null> {
    // Skip lookups for private/local IPs
    if (!ip || ip === 'unknown' || ip.startsWith('127.') ||
        ip.startsWith('192.168.') || ip.startsWith('10.') || ip === '::1') {
        return null;
    }

    try {
        const response = await fetch(
            `http://ip-api.com/json/${ip}?fields=city,regionName,country,countryCode,status`,
            { signal: AbortSignal.timeout(2000) } // 2s max — don't slow the request
        );

        if (!response.ok) return null;
        const data: GeoResult & { status: string } = await response.json();

        if (data.status !== 'success') return null;
        return `${data.city}, ${data.countryCode}`;  // e.g. "Nairobi, KE"

    } catch {
        return null; // timeout or network error — fail silently
    }
}
