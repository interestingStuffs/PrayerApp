const fetchContent = async (source) => {
    try {
        // Add a cache-busting query parameter
        const cacheBuster = `?t=${new Date().getTime()}`;
        const response = await fetch(source + cacheBuster);
        const contentType = response.headers.get('Content-Type'); // Get the content type from the response
        const text = await response.text();

        // If the file is a markdown (.md) based on content type or extension, process it as markdown
        if (source.endsWith('.md') || contentType.includes('markdown')) {
            return parseMarkdown(text);
        } 
        // If it's a Google Sheets file or plain text, check the URL and treat it as .txt
        else if (source.endsWith('.txt') || contentType.includes('plain') || source.includes('docs.google.com')) {
            return parseText(text);
        } 
        else {
            throw new Error('Unsupported file format');
        }
    } catch (error) {
        console.error('Error fetching content:', error);
        return [];
    }
};

const parseMarkdown = (markdown) => {
    const sections = markdown.split('---').map(section => {
        const lines = section.split('\n');
        const title = lines.find(line => line.startsWith('# '))?.replace('# ', '').trim();
        const subtitle = lines.find(line => line.startsWith('## '))?.replace('## ', '').trim();
        const content = section.trim();

        return { title, subtitle, content };
    });

    return sections;
};

const parseText = (txt) => {
    const sections = [];
    
    // Strip the Google Sheets JSON response format
    const regex = /google\.visualization\.Query\.setResponse\((\{.*\})\);/;
    const matches = txt.match(regex);
    if (matches && matches[1]) {
        const jsonData = JSON.parse(matches[1]);
        
        // Extract rows, ignoring header row
        const rows = jsonData.table.rows.slice(1); // Skip the first row (header)

        rows.forEach(row => {
            const title = row.c[0]?.v || '';  // First column
            const subtitle = row.c[1]?.v || ''; // Second column
            const content = row.c[2]?.v || ''; // Third column (Text)
            const image = row.c[3]?.v || '';  // Fourth column (Image URL)

            sections.push({
                title,
                subtitle,
                content,
                image
            });
        });
    }

    return sections;
};

const renderButtons = (sections) => {
    const container = document.getElementById('buttons-container');
    container.innerHTML = ''; // Clear previous buttons

    sections.forEach((section, index) => {
        const button = document.createElement('button');
        button.innerHTML = `
            <strong>${section.title}</strong><br>
            <small>${section.subtitle}</small>
        `;
        button.addEventListener('click', () => showContent(section));
        container.appendChild(button);
    });
};

const showContent = (section) => {
    document.getElementById('main-page').classList.add('hidden');
    document.getElementById('content-page').classList.remove('hidden');
    const contentContainer = document.getElementById('content');
    
    // Render the content and optional image
    contentContainer.innerHTML = marked.parse(section.content); // Using 'marked' library for Markdown rendering
    
    if (section.image) {
        const imageElement = document.createElement('img');
        imageElement.src = section.image;
        contentContainer.appendChild(imageElement);
    }
};

document.getElementById('load-btn').addEventListener('click', async () => {
    const loadingElement = document.getElementById('loading');
    loadingElement.classList.remove('hidden'); // Show loading message
    const sections = await fetchContent('https://raw.githubusercontent.com/interestingStuffs/PrayerApp/refs/heads/main/example.md'); // You can use an .md file or a google sheet url in this format: https://docs.google.com/spreadsheets/d/YOUR_ITEM_ID/gviz/tq?tqx=out:txt
    renderButtons(sections);
    loadingElement.classList.add('hidden'); // Hide loading message
});
