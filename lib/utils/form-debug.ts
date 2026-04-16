
/**
 * Utility to log FormData entries for debugging purposes.
 * Use this to trace the lifecycle of forms in the system.
 */
export function logFormData(title: string, formData: FormData) {
    console.log(`--- [FORM DEBUG] ${title} ---`);
    const entries: Record<string, string | File> = {};
    formData.forEach((value, key) => {
        entries[key] = value;
    });
    console.log(JSON.stringify(entries, null, 2));
    console.log(`--- END ${title} ---`);
}
