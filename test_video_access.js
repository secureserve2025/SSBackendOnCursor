// Test script to debug video access issues
// Run this in your browser console on the client dashboard page

console.log('=== Video Access Debug Test ===');

// 1. Test the specific URL that's failing
const testUrl = 'https://jwdpzqaptvzfgqylecsj.supabase.co/storage/v1/object/public/work-products/259bc32e-b934-40ea-86c6-50bfb726528b/49f8f594-14c2-4996-9707-488bcfabdd43/Generated File June 19, 2025 - 3_07PM.mp4';
console.log('Testing URL:', testUrl);

// 2. Test with URL encoding for spaces
const encodedUrl = 'https://jwdpzqaptvzfgqylecsj.supabase.co/storage/v1/object/public/work-products/259bc32e-b934-40ea-86c6-50bfb726528b/49f8f594-14c2-4996-9707-488bcfabdd43/Generated%20File%20June%2019,%202025%20-%203_07PM.mp4';
console.log('Testing encoded URL:', encodedUrl);

// 3. Test both URLs
async function testUrls() {
    console.log('Testing original URL...');
    try {
        const response1 = await fetch(testUrl, { method: 'HEAD' });
        console.log('Original URL status:', response1.status, response1.statusText);
        console.log('Original URL headers:', Object.fromEntries(response1.headers.entries()));
    } catch (error) {
        console.error('Original URL error:', error);
    }

    console.log('Testing encoded URL...');
    try {
        const response2 = await fetch(encodedUrl, { method: 'HEAD' });
        console.log('Encoded URL status:', response2.status, response2.statusText);
        console.log('Encoded URL headers:', Object.fromEntries(response2.headers.entries()));
    } catch (error) {
        console.error('Encoded URL error:', error);
    }
}

// 4. Check current user and authentication
function checkAuth() {
    console.log('=== Authentication Check ===');
    console.log('Current user ID:', window.supabase?.auth?.user()?.id);
    console.log('Is authenticated:', window.supabase?.auth?.session() ? 'Yes' : 'No');
    console.log('Session:', window.supabase?.auth?.session());
}

// 5. Test Supabase storage access
async function testStorageAccess() {
    console.log('=== Storage Access Test ===');
    
    if (window.supabase) {
        try {
            // Test listing files in the work-products bucket
            const { data, error } = await window.supabase.storage
                .from('work-products')
                .list('259bc32e-b934-40ea-86c6-50bfb726528b/49f8f594-14c2-4996-9707-488bcfabdd43/');
            
            if (error) {
                console.error('Storage list error:', error);
            } else {
                console.log('Files in directory:', data);
            }
        } catch (error) {
            console.error('Storage test error:', error);
        }
    } else {
        console.error('Supabase client not available');
    }
}

// Run all tests
console.log('Running all tests...');
testUrls();
checkAuth();
testStorageAccess();

// 6. Helper function to test different URL formats
function testUrlFormats(filePath) {
    const baseUrl = 'https://jwdpzqaptvzfgqylecsj.supabase.co/storage/v1/object/public/work-products/';
    
    const formats = [
        `${baseUrl}${filePath}`,
        `${baseUrl}${encodeURIComponent(filePath)}`,
        `${baseUrl}${filePath.replace(/ /g, '%20')}`,
        `${baseUrl}${filePath.replace(/ /g, '+')}`
    ];
    
    console.log('Testing different URL formats:');
    formats.forEach((url, index) => {
        console.log(`${index + 1}. ${url}`);
    });
    
    return formats;
}

// Test the specific file path
const filePath = '259bc32e-b934-40ea-86c6-50bfb726528b/49f8f594-14c2-4996-9707-488bcfabdd43/Generated File June 19, 2025 - 3_07PM.mp4';
testUrlFormats(filePath); 