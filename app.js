(() => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const controls = document.getElementById('controls');
    const fileList = document.getElementById('fileList');
    const qualitySlider = document.getElementById('qualitySlider');
    const qualityValue = document.getElementById('qualityValue');
    const convertBtn = document.getElementById('convertBtn');
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    const clearBtn = document.getElementById('clearBtn');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');

    let files = [];
    let convertedBlobs = new Map();

    // Drop zone events
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const droppedFiles = Array.from(e.dataTransfer.files).filter(isHeic);
        if (droppedFiles.length) addFiles(droppedFiles);
    });

    fileInput.addEventListener('change', () => {
        const selected = Array.from(fileInput.files).filter(isHeic);
        if (selected.length) addFiles(selected);
        fileInput.value = '';
    });

    qualitySlider.addEventListener('input', () => {
        qualityValue.textContent = qualitySlider.value;
    });

    convertBtn.addEventListener('click', convertAll);
    downloadAllBtn.addEventListener('click', downloadZip);
    clearBtn.addEventListener('click', clearAll);

    function isHeic(file) {
        const name = file.name.toLowerCase();
        return name.endsWith('.heic') || name.endsWith('.heif');
    }

    function formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    }

    function getBaseName(filename) {
        return filename.replace(/\.(heic|heif)$/i, '');
    }

    function addFiles(newFiles) {
        files = files.concat(newFiles);
        controls.classList.add('visible');
        convertBtn.disabled = false;
        renderFileList();
    }

    function renderFileList() {
        fileList.innerHTML = '';
        files.forEach((file, index) => {
            const blob = convertedBlobs.get(index);
            const item = document.createElement('div');
            item.className = 'file-item';

            const preview = document.createElement('div');
            preview.className = 'file-item-preview';
            if (blob) {
                const img = document.createElement('img');
                img.className = 'file-item-preview';
                img.src = URL.createObjectURL(blob);
                item.appendChild(img);
            } else {
                item.appendChild(preview);
            }

            const info = document.createElement('div');
            info.className = 'file-item-info';
            const name = document.createElement('div');
            name.className = 'file-item-name';
            name.textContent = file.name;
            const size = document.createElement('div');
            size.className = 'file-item-size';
            size.textContent = formatSize(file.size);
            if (blob) {
                size.textContent += ` → ${formatSize(blob.size)} JPG`;
            }
            info.appendChild(name);
            info.appendChild(size);
            item.appendChild(info);

            const status = document.createElement('span');
            status.className = 'file-item-status';
            if (blob) {
                status.className += ' status-done';
                status.textContent = 'Done';
            } else {
                status.className += ' status-pending';
                status.textContent = 'Pending';
            }
            item.appendChild(status);

            if (blob) {
                const actions = document.createElement('div');
                actions.className = 'file-item-actions';
                const dlBtn = document.createElement('button');
                dlBtn.className = 'btn btn-secondary btn-sm';
                dlBtn.textContent = 'Download';
                dlBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    downloadSingle(index);
                });
                actions.appendChild(dlBtn);
                item.appendChild(actions);
            }

            fileList.appendChild(item);
        });
    }

    async function convertAll() {
        if (!files.length) return;

        convertBtn.disabled = true;
        convertBtn.textContent = 'Converting...';
        downloadAllBtn.disabled = true;
        progressContainer.classList.add('visible');
        progressBar.style.width = '0%';

        let completed = 0;

        for (let i = 0; i < files.length; i++) {
            if (convertedBlobs.has(i)) {
                completed++;
                continue;
            }

            updateFileStatus(i, 'Converting...', 'status-converting');

            try {
                const blob = await heic2any({
                    blob: files[i],
                    toType: 'image/jpeg',
                    quality: qualitySlider.value / 100,
                });

                const result = Array.isArray(blob) ? blob[0] : blob;
                convertedBlobs.set(i, result);
                updateFileStatus(i, 'Done', 'status-done');
            } catch (err) {
                console.error(`Error converting ${files[i].name}:`, err);
                updateFileStatus(i, 'Error', 'status-error');
            }

            completed++;
            progressBar.style.width = `${(completed / files.length) * 100}%`;
        }

        convertBtn.textContent = 'Convert All';
        convertBtn.disabled = false;
        renderFileList();

        if (convertedBlobs.size > 0) {
            downloadAllBtn.disabled = false;
        }

        if (convertedBlobs.size === 1) {
            downloadSingle(convertedBlobs.keys().next().value);
        }
    }

    function updateFileStatus(index, text, className) {
        const items = fileList.querySelectorAll('.file-item');
        if (!items[index]) return;
        const status = items[index].querySelector('.file-item-status');
        if (status) {
            status.textContent = text;
            status.className = 'file-item-status ' + className;
        }
    }

    function downloadSingle(index) {
        const blob = convertedBlobs.get(index);
        if (!blob) return;
        const name = getBaseName(files[index].name) + '.jpg';
        saveAs(blob, name);
    }

    async function downloadZip() {
        if (convertedBlobs.size === 0) return;

        downloadAllBtn.disabled = true;
        downloadAllBtn.textContent = 'Zipping...';

        const zip = new JSZip();
        convertedBlobs.forEach((blob, index) => {
            const name = getBaseName(files[index].name) + '.jpg';
            zip.file(name, blob);
        });

        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, 'heic-to-jpg.zip');

        downloadAllBtn.textContent = 'Download ZIP';
        downloadAllBtn.disabled = false;
    }

    function clearAll() {
        files = [];
        convertedBlobs = new Map();
        fileList.innerHTML = '';
        controls.classList.remove('visible');
        progressContainer.classList.remove('visible');
        progressBar.style.width = '0%';
        downloadAllBtn.disabled = true;
    }
})();
