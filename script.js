document.addEventListener('DOMContentLoaded', () => {
    const downloadForm = document.getElementById('download-form');
    const videoUrlInput = document.getElementById('video-url');
    const resultsSection = document.getElementById('results-section');
    const loadingIndicator = document.getElementById('loading');
    const errorMessageDiv = document.getElementById('error-message');
    const downloadOptionsDiv = document.getElementById('download-options');
    const platformListDiv = document.getElementById('platform-list');
    const yearSpan = document.getElementById('year');

    // --- Configuration ---
    // ** IMPORTANT: Replace this with the actual URL of your backend API endpoint **
    // This backend service will take the video URL and return download links.
    const BACKEND_API_URL = 'https://telegram-n3abzy905-lk3140318s-projects.vercel.app/'; // e.g., 'https://your-api.com/download'

    // List of supported platforms (URLs are just for display/info, backend handles logic)
    // Easily update this list by adding/removing entries.
    const supportedPlatforms = [
        { name: 'YouTube', url: 'https://www.youtube.com/' },
        { name: 'Facebook', url: 'https://www.facebook.com/' },
        { name: 'Instagram', url: 'https://www.instagram.com/' },
        { name: 'Twitter / X', url: 'https://x.com/' },
        { name: 'TikTok', url: 'https://www.tiktok.com/' },
        { name: 'Vimeo', url: 'https://vimeo.com/' },
        // Add more platforms here
        // { name: 'PlatformName', url: 'https://platform.com/' },
    ];
    // --- End Configuration ---

    // --- Initialize ---
    // Display Supported Platforms
    function displayPlatforms() {
        platformListDiv.innerHTML = ''; // Clear existing
        supportedPlatforms.forEach(platform => {
            // You could use logos here instead of just text
            const platformElement = document.createElement('span');
            platformElement.classList.add('platform-item');
            platformElement.textContent = platform.name;
            // Optional: Link to the platform's homepage (opens in new tab)
            // const platformLink = document.createElement('a');
            // platformLink.href = platform.url;
            // platformLink.target = '_blank';
            // platformLink.rel = 'noopener noreferrer';
            // platformLink.classList.add('platform-item');
            // platformLink.textContent = platform.name;
            // platformListDiv.appendChild(platformLink);
             platformListDiv.appendChild(platformElement);
        });
    }

    // Set current year in footer
    function setFooterYear() {
        yearSpan.textContent = new Date().getFullYear();
    }

    displayPlatforms();
    setFooterYear();
    // --- End Initialize ---


    // --- Event Listeners ---
    downloadForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission
        const videoUrl = videoUrlInput.value.trim();

        // Basic URL validation
        if (!isValidUrl(videoUrl)) {
            showError('Please enter a valid video URL.');
            return;
        }

        // Clear previous results and errors
        clearResults();
        showLoading(true);

        // ** !!! THIS IS WHERE THE BACKEND CALL HAPPENS !!! **
        try {
            // Replace the mock function with a real fetch call to your backend
            // const downloadData = await fetchDownloadLinksFromBackend(videoUrl);

            // ** Mock Implementation (Remove this when using a real backend) **
            const downloadData = await mockFetchDownloadLinks(videoUrl);
            // ** End Mock Implementation **


            if (downloadData && downloadData.success && downloadData.links.length > 0) {
                displayDownloadOptions(downloadData.links, downloadData.title || 'Video');
            } else {
                showError(downloadData.message || 'Could not fetch download links. The platform might be unsupported or the link invalid.');
            }
        } catch (error) {
            console.error('Error fetching download links:', error);
            showError('An unexpected error occurred. Please try again later.');
        } finally {
            showLoading(false);
        }
    });
    // --- End Event Listeners ---


    // --- Core Functions ---

    // ** !!! REPLACE THIS WITH YOUR ACTUAL BACKEND API CALL !!! **
    async function fetchDownloadLinksFromBackend(url) {
        // This function needs to make a POST request (usually) to your backend
        // Send the video URL in the request body
        // Handle the response (which should contain download links or an error message)

        if (BACKEND_API_URL === 'YOUR_BACKEND_API_ENDPOINT_HERE') {
             console.warn("Backend API URL is not set. Using mock data.");
             return mockFetchDownloadLinks(url); // Fallback to mock if no URL set
        }

        try {
            const response = await fetch(BACKEND_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Add any other required headers (like API keys if needed)
                },
                body: JSON.stringify({ videoUrl: url }) // Send URL in body
            });

            if (!response.ok) {
                // Try to get error message from backend response body
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    // If response is not JSON or empty
                    errorData = { message: `Error: ${response.status} ${response.statusText}` };
                }
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data; // Expecting format like { success: true, title: "Video Title", links: [{ quality: '720p', url: '...' }, ...] } or { success: false, message: 'Error details' }

        } catch (error) {
            console.error("Backend fetch error:", error);
            return { success: false, message: error.message || 'Failed to connect to the download service.' };
        }
    }
    // ** !!! END OF BACKEND API CALL FUNCTION !!! **


    // ** Mock Function (REMOVE WHEN USING REAL BACKEND) **
    // Simulates fetching links after a short delay
    function mockFetchDownloadLinks(url) {
        console.log(`Mock fetching for URL: ${url}`);
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulate success or failure based on URL (very basic)
                if (url.includes('youtube.com') || url.includes('youtu.be')) {
                    resolve({
                        success: true,
                        title: "Example YouTube Video Title",
                        links: [
                            { quality: '1080p', url: '#download-link-1080p', type: 'MP4', size: '50 MB' },
                            { quality: '720p', url: '#download-link-720p', type: 'MP4', size: '30 MB' },
                            { quality: '480p', url: '#download-link-480p', type: 'MP4', size: '15 MB' },
                            { quality: 'Audio', url: '#download-link-audio', type: 'MP3', size: '5 MB' },
                        ]
                    });
                } else if (url.includes('tiktok.com')) {
                     resolve({
                        success: true,
                        title: "Example TikTok Video",
                        links: [
                            { quality: 'HD', url: '#download-link-tiktok-hd', type: 'MP4', size: '10 MB' },
                            { quality: 'Watermarked', url: '#download-link-tiktok-wm', type: 'MP4', size: '10 MB' },
                        ]
                    });
                } else if (url.includes('facebook.com') || url.includes('fb.watch')) {
                     resolve({
                        success: true,
                        title: "Example Facebook Video",
                        links: [
                            { quality: 'HD', url: '#download-link-fb-hd', type: 'MP4', size: '25 MB' },
                            { quality: 'SD', url: '#download-link-fb-sd', type: 'MP4', size: '12 MB' },
                        ]
                    });
                 } else if (url.includes('invalid-link')) {
                     resolve({ success: false, message: 'The provided link is invalid or cannot be processed (Mock Error).' });
                 }
                 else {
                    // Generic success for other URLs in mock mode
                     resolve({
                        success: true,
                        title: "Example Social Media Video",
                        links: [
                            { quality: '720p', url: '#download-link-generic-720p', type: 'MP4', size: '20 MB' },
                            { quality: '480p', url: '#download-link-generic-480p', type: 'MP4', size: '10 MB' },
                        ]
                    });
                }
            }, 1500); // Simulate network delay
        });
    }
    // ** End Mock Function **


    function displayDownloadOptions(links, title) {
        clearResults(); // Clear previous results/errors

        // Optional: Display Video Title
        // const titleElement = document.createElement('h3');
        // titleElement.textContent = `Title: ${title}`;
        // titleElement.style.marginBottom = '1rem';
        // downloadOptionsDiv.appendChild(titleElement);

        links.forEach(link => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('download-item');

            const qualitySpan = document.createElement('span');
            qualitySpan.textContent = `${link.quality} ${link.type ? '(' + link.type + ')' : ''} ${link.size ? '[' + link.size + ']' : ''}`;

            const actionsDiv = document.createElement('div');
            actionsDiv.classList.add('actions');

            // Download Button (as a link)
            const downloadBtn = document.createElement('a'); // Use <a> for direct download
            downloadBtn.href = link.url;
            downloadBtn.textContent = 'Download';
            downloadBtn.classList.add('download-btn');
            downloadBtn.setAttribute('download', ''); // Suggests browser should download the linked file
            downloadBtn.setAttribute('target', '_blank'); // Open in new tab/initiate download without leaving page
            downloadBtn.setAttribute('rel', 'noopener noreferrer');


            // Copy Link Button
            const copyBtn = document.createElement('button');
            copyBtn.textContent = 'Copy Link';
            copyBtn.classList.add('copy-btn');
            copyBtn.addEventListener('click', () => copyToClipboard(link.url, copyBtn));

            actionsDiv.appendChild(downloadBtn);
            actionsDiv.appendChild(copyBtn);

            itemDiv.appendChild(qualitySpan);
            itemDiv.appendChild(actionsDiv);

            downloadOptionsDiv.appendChild(itemDiv);
        });
         resultsSection.style.display = 'block'; // Ensure section is visible
    }

    function copyToClipboard(text, buttonElement) {
        navigator.clipboard.writeText(text).then(() => {
            // Success feedback
            const originalText = buttonElement.textContent;
            buttonElement.textContent = 'Copied!';
            buttonElement.classList.add('copied');
            buttonElement.disabled = true; // Disable briefly

            setTimeout(() => {
                buttonElement.textContent = originalText;
                buttonElement.classList.remove('copied');
                buttonElement.disabled = false;
            }, 2000); // Revert after 2 seconds
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            // Optional: Show error feedback to user
            alert("Failed to copy link. Your browser might not support this feature or permissions are denied.");
        });
    }

    function showLoading(isLoading) {
        if (isLoading) {
            clearResults(); // Clear anything else before showing loading
            loadingIndicator.style.display = 'flex';
            resultsSection.style.display = 'block'; // Ensure section is visible
        } else {
            loadingIndicator.style.display = 'none';
        }
    }

    function showError(message) {
        clearResults(); // Clear other results/loading
        errorMessageDiv.textContent = message;
        errorMessageDiv.style.display = 'block';
        resultsSection.style.display = 'block'; // Ensure section is visible
    }

    function clearResults() {
        loadingIndicator.style.display = 'none';
        errorMessageDiv.style.display = 'none';
        errorMessageDiv.textContent = '';
        downloadOptionsDiv.innerHTML = ''; // Clear previous download links
        // Don't hide resultsSection immediately, let new content replace old
    }

    function isValidUrl(string) {
        try {
            new URL(string);
            // Basic check for common domain patterns (optional but helpful)
            return string.includes('.') && (string.startsWith('http://') || string.startsWith('https://'));
        } catch (_) {
            return false;
        }
    }
});
