document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const dropzone = document.getElementById('main-dropzone');
    const fileInput = document.getElementById('pdf-file-input');
    const loadingEl = document.getElementById('loading');
    const composerArea = document.getElementById('composer-area');
    const pagesGrid = document.getElementById('pages-grid');
    const pageCountEl = document.getElementById('page-count');
    const exportBtn = document.getElementById('export-btn');
    const clearAllBtn = document.getElementById('clear-all-btn');

    // --- State ---
    let filesData = []; // { id, name, arrayBuffer }
    let pagesData = []; // { id, fileId, fileName, pageIndex, rotation, thumbnail }
    let draggedPageId = null;

    // --- Drag & Drop for File Upload ---
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleFiles(e.dataTransfer.files);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFiles(e.target.files);
        }
    });

    // --- File Processing ---
    async function handleFiles(fileList) {
        showLoading(true);

        try {
            const pdfFiles = Array.from(fileList).filter(f => f.type === 'application/pdf');
            if (pdfFiles.length === 0) {
                alert("Please drop valid PDF files.");
                showLoading(false);
                return;
            }

            for (const file of pdfFiles) {
                const arrayBuffer = await file.arrayBuffer();
                const fileId = `file-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

                filesData.push({ id: fileId, name: file.name, arrayBuffer });

                // Use PDF.js to extract thumbnails
                const typedArray = new Uint8Array(arrayBuffer);
                const pdfJsDoc = await pdfjsLib.getDocument({ data: typedArray }).promise;

                for (let i = 1; i <= pdfJsDoc.numPages; i++) {
                    const page = await pdfJsDoc.getPage(i);
                    const viewport = page.getViewport({ scale: 0.5 }); // smaller scale for thumbnail

                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    await page.render({ canvasContext: context, viewport: viewport }).promise;

                    pagesData.push({
                        id: `page-${fileId}-${i}-${Date.now()}`,
                        fileId: fileId,
                        fileName: file.name,
                        pageIndex: i - 1,   // pdf-lib is 0-indexed, pdf.js is 1-indexed
                        originalPageNumber: i,
                        rotation: 0,        // additional user rotation
                        thumbnail: canvas.toDataURL('image/jpeg', 0.8)
                    });
                }
            }

            updateUI();
        } catch (error) {
            console.error("Error processing PDFs:", error);
            alert("Error reading PDF files. See console for details.");
        } finally {
            showLoading(false);
            fileInput.value = ''; // reset input
        }
    }

    // --- UI Rendering ---
    function updateUI() {
        pagesGrid.innerHTML = '';
        pageCountEl.textContent = pagesData.length;

        if (pagesData.length > 0) {
            composerArea.classList.remove('hidden');
        } else {
            composerArea.classList.add('hidden');
        }

        pagesData.forEach((pageObj) => {
            const card = document.createElement('div');
            card.className = 'page-card';
            card.draggable = true;
            card.dataset.id = pageObj.id;

            card.innerHTML = `
                <div class="thumbnail-container">
                    <img src="${pageObj.thumbnail}" style="transform: rotate(${pageObj.rotation}deg)">
                    <span class="page-number">${pageObj.originalPageNumber}</span>
                </div>
                <div class="card-actions">
                    <span class="file-source" title="${pageObj.fileName}">${pageObj.fileName}</span>
                    <div class="action-btns">
                        <button class="icon-btn rotate-btn" title="Rotate" data-id="${pageObj.id}">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                        </button>
                        <button class="icon-btn delete-btn" title="Remove" data-id="${pageObj.id}">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                        </button>
                    </div>
                </div>
            `;

            // Setup Card Drag and Drop properties
            card.addEventListener('dragstart', handleDragStart);
            card.addEventListener('dragover', handleDragOver);
            card.addEventListener('dragenter', handleDragEnter);
            card.addEventListener('dragleave', handleDragLeave);
            card.addEventListener('drop', handleDrop);
            card.addEventListener('dragend', handleDragEnd);

            // Card Action Buttons
            const rotateBtn = card.querySelector('.rotate-btn');
            rotateBtn.addEventListener('click', () => {
                pageObj.rotation = (pageObj.rotation + 90) % 360;
                const img = card.querySelector('.thumbnail-container img');
                img.style.transform = `rotate(${pageObj.rotation}deg)`;
            });

            const deleteBtn = card.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => {
                pagesData = pagesData.filter(p => p.id !== pageObj.id);
                updateUI();
            });

            pagesGrid.appendChild(card);
        });
    }

    // --- Drag and Drop Logic for Reordering ---
    function handleDragStart(e) {
        draggedPageId = this.dataset.id;
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        // Needs a delay for the visual drag image to capture the card before we alter its opacity
        setTimeout(() => this.style.opacity = '0.5', 0);
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        return false;
    }

    function handleDragEnter(e) {
        e.preventDefault();
        if (this.dataset.id !== draggedPageId) {
            this.classList.add('drag-over');
        }
    }

    function handleDragLeave(e) {
        this.classList.remove('drag-over');
    }

    function handleDrop(e) {
        e.stopPropagation();
        this.classList.remove('drag-over');

        const targetId = this.dataset.id;
        if (draggedPageId !== targetId) {
            // Reorder pagesData
            const draggedIndex = pagesData.findIndex(p => p.id === draggedPageId);
            const targetIndex = pagesData.findIndex(p => p.id === targetId);

            const draggedItem = pagesData.splice(draggedIndex, 1)[0];
            pagesData.splice(targetIndex, 0, draggedItem);

            updateUI(); // Complete re-render to reflect new array state
        }
        return false;
    }

    function handleDragEnd(e) {
        this.classList.remove('dragging');
        this.style.opacity = '1';

        // Ensure all drag-over classes are removed if drop failed or cancelled
        document.querySelectorAll('.page-card').forEach(card => card.classList.remove('drag-over'));
    }

    // --- Export Logic ---
    exportBtn.addEventListener('click', async () => {
        if (pagesData.length === 0) return;

        showLoading(true, "Generating Document...");

        try {
            const { PDFDocument, degrees } = PDFLib;
            const mergedPdf = await PDFDocument.create();

            // Map to cache parsed PDFDocuments to avoid re-parsing the same file multiple times
            const parsedDocs = {};

            for (const pageObj of pagesData) {
                // Parse document if we haven't already for this export session
                if (!parsedDocs[pageObj.fileId]) {
                    const fileObj = filesData.find(f => f.id === pageObj.fileId);
                    parsedDocs[pageObj.fileId] = await PDFDocument.load(fileObj.arrayBuffer);
                }

                const sourceDoc = parsedDocs[pageObj.fileId];

                // Copy the specific page
                const [copiedPage] = await mergedPdf.copyPages(sourceDoc, [pageObj.pageIndex]);

                // If user rotated it, apply rotation
                if (pageObj.rotation !== 0) {
                    const currentRotation = copiedPage.getRotation().angle;
                    copiedPage.setRotation(degrees(currentRotation + pageObj.rotation));
                }

                mergedPdf.addPage(copiedPage);
            }

            const pdfBytes = await mergedPdf.save();
            downloadPdf(pdfBytes, 'composed_document.pdf');
        } catch (error) {
            console.error("Export error:", error);
            alert("Error exporting PDF. See console for details.");
        } finally {
            showLoading(false);
        }
    });

    clearAllBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to clear all pages?")) {
            pagesData = [];
            filesData = [];
            updateUI();
        }
    });

    function showLoading(show, message = "Processing...") {
        const span = loadingEl.querySelector('span');
        if (span) span.textContent = message;
        if (show) {
            loadingEl.classList.remove('hidden');
            dropzone.classList.add('hidden'); // Optional: hide dropzone while loading if we want
        } else {
            loadingEl.classList.add('hidden');
            dropzone.classList.remove('hidden');
        }
    }

    function downloadPdf(bytes, filename) {
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});
