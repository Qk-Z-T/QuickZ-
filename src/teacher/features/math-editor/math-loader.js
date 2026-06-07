// src/teacher/features/math-editor/math-loader.js
// Load math panel HTML dynamically

export async function loadMathPanel() {
    try {
        const response = await fetch('../src/teacher/features/math-editor/math-panel.html');
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const panel = doc.getElementById('math-symbols-panel');
        if (panel) {
            document.getElementById('math-panel-container').appendChild(panel);
        }
        console.log('Math panel loaded successfully');
    } catch (error) {
        console.error('Failed to load math panel:', error);
    }
}
