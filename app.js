// Modular functions
const fetchContent = async (source) => {
    try {
        const response = await fetch(source);
        const text = await response.text();
        return parseMarkdown(text);
    } catch (error) {
        console.error('Error fetching content:', error);
        return [];
    }
};

const parseMarkdown = (markdown) => {
    // Split the markdown content by '---' delimiter
    const sections = markdown.split('---').map(section => {
        const lines = section.split('\n');
        const title = lines.find(line => line.startsWith('# '))?.replace('# ', '').trim();
        const subtitle = lines.find(line => line.startsWith('## '))?.replace('## ', '').trim();
        const content = section.trim();

        return { title, subtitle, content };
    });

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
    contentContainer.innerHTML = marked.parse(section.content); // Using 'marked' library for Markdown rendering
};

document.getElementById('load-btn').addEventListener('click', async () => {
    const sections = await fetchContent('https://raw.githubusercontent.com/interestingStuffs/PrayerApp/refs/heads/main/example.md'); // Change this URL to your actual file source
    renderButtons(sections);
});