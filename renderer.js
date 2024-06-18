// renderer.js
const { ipcRenderer } = require('electron');
const path = require('path');

const importBtn = document.getElementById('importBtn');
const libraryContainer = document.getElementById('libraryContainer');

importBtn.addEventListener('click', () => {
    ipcRenderer.send('import-files');
});

ipcRenderer.on('import-complete', (event, library) => {
    // Clear the library container
    libraryContainer.innerHTML = '';

    // Display the imported files in a grid with uniform preview icons
    Object.keys(library).forEach((file) => {
        const fileItem = document.createElement('div');
        fileItem.classList.add('fileItem');

        const previewContainer = document.createElement('div');
        previewContainer.classList.add('previewContainer');

        const img = document.createElement('img');
        img.src = library[file];
        previewContainer.appendChild(img);

        fileItem.appendChild(previewContainer);

        const fileName = document.createElement('span');
        fileName.textContent = path.basename(file);
        fileItem.appendChild(fileName);

        libraryContainer.appendChild(fileItem);
    });
});