const { ipcRenderer } = require('electron');

const importBtn = document.getElementById('importBtn');
const libraryContainer = document.getElementById('libraryContainer');

importBtn.addEventListener('click', () => {
    ipcRenderer.send('import-files');
});

ipcRenderer.on('import-complete', (event, library) => {
    // Display the imported files in the library container
    Object.keys(library).forEach((file) => {
        const fileItem = document.createElement('div');
        fileItem.textContent = file;
        libraryContainer.appendChild(fileItem);
    });
});