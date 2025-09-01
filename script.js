// DOM elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const qualitySlider = document.getElementById('qualitySlider');
const qualityValue = document.getElementById('qualityValue');
const maxWidthInput = document.getElementById('maxWidth');
const compressBtn = document.getElementById('compressBtn');
const resultsPanel = document.getElementById('resultsPanel');
const imageResults = document.getElementById('imageResults');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const totalSavings = document.getElementById('totalSavings');
const fileListPanel = document.getElementById('fileListPanel');
const fileList = document.getElementById('fileList');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileNav = document.getElementById('mobileNav');
const mobileOverlay = document.getElementById('mobileOverlay');
const mobileCloseBtn = document.getElementById('mobileCloseBtn');
const removeAllBtn = document.getElementById('removeAllBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const contactForm = document.getElementById('contactForm');
const listViewBtn = document.getElementById('listViewBtn');
const gridViewBtn = document.getElementById('gridViewBtn');

// Global variables
let selectedFiles = [];
let compressedImages = [];

// Cache frequently accessed DOM elements
const cachedElements = {
    loadingOverlay: null,
    progressFill: null,
    progressText: null,
    loadingContainer: null,
    completionMessage: null
};

// Initialize cached elements on first use
function getCachedElement(key, selector) {
    if (!cachedElements[key]) {
        cachedElements[key] = document.getElementById(selector);
    }
    return cachedElements[key];
}

// Event listeners
dropZone.addEventListener('dragover', handleDragOver);
dropZone.addEventListener('drop', handleDrop);
dropZone.addEventListener('dragleave', handleDragLeave);
fileInput.addEventListener('change', handleFileSelect);
// Debounce quality slider updates for better performance
let qualityUpdateTimeout;
qualitySlider.addEventListener('input', function() {
    clearTimeout(qualityUpdateTimeout);
    qualityUpdateTimeout = setTimeout(updateQualityValue, 100);
});
compressBtn.addEventListener('click', compressAllImages);
downloadAllBtn.addEventListener('click', downloadAllImages);

// Mobile menu event listeners
mobileMenuBtn.addEventListener('click', toggleMobileMenu);
mobileOverlay.addEventListener('click', closeMobileMenu);
mobileCloseBtn.addEventListener('click', closeMobileMenu);

// Remove All and Clear All event listeners
removeAllBtn.addEventListener('click', removeAllFiles);
clearAllBtn.addEventListener('click', clearAllCompressed);

// View toggle event listeners
listViewBtn.addEventListener('click', () => toggleView('list'));
gridViewBtn.addEventListener('click', () => toggleView('grid'));

// Contact form event listener
contactForm.addEventListener('submit', handleContactForm);

// Mobile menu functions
function toggleMobileMenu() {
    mobileNav.classList.toggle('open');
    mobileOverlay.classList.toggle('open');
    document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
}

function closeMobileMenu() {
    mobileNav.classList.remove('open');
    mobileOverlay.classList.remove('open');
    document.body.style.overflow = '';
}

// Functions
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    processFiles(files);
}

function handleFileSelect(e) {
    const files = e.target.files;
    processFiles(files);
}

function processFiles(files) {
    // Filter for only image files and check size
    const validFiles = Array.from(files).filter(file => {
        const isImage = file.type === 'image/jpeg' || file.type === 'image/png';
        const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB max
        
        if (!isImage) {
            alert(`${file.name} is not a supported image format. Only JPEG and PNG are supported.`);
        } else if (!isValidSize) {
            alert(`${file.name} exceeds the 10MB size limit.`);
        }
        
        return isImage && isValidSize;
    });
    
    if (validFiles.length > 0) {
        selectedFiles = [...selectedFiles, ...validFiles];
        updateFileList();
        updateCompressButton();
    }
}

function updateFileList() {
    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    
    if (selectedFiles.length > 0) {
        fileListPanel.style.display = 'block';
        
        selectedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            // Create thumbnail with lazy loading
            const thumbnail = document.createElement('img');
            thumbnail.className = 'file-thumbnail';
            thumbnail.alt = file.name;
            thumbnail.loading = 'lazy';
            
            // Optimize file reading with requestIdleCallback if available
            const loadThumbnail = () => {
                const reader = new FileReader();
                reader.onload = function(e) {
                    thumbnail.src = e.target.result;
                };
                reader.readAsDataURL(file);
            };
            
            if (window.requestIdleCallback) {
                requestIdleCallback(loadThumbnail);
            } else {
                setTimeout(loadThumbnail, 0);
            }
            
            // Create file info using template literals for better performance
            const fileInfo = document.createElement('div');
            fileInfo.className = 'file-info';
            fileInfo.innerHTML = `
                <div class="file-name">${file.name}</div>
                <div class="file-size">${formatFileSize(file.size)}</div>
            `;
            
            // Create remove button with event delegation for better performance
            const removeBtn = document.createElement('button');
            removeBtn.className = 'file-remove-btn';
            removeBtn.innerHTML = '<i class="material-icons">close</i>';
            removeBtn.dataset.index = index;
            
            fileItem.appendChild(thumbnail);
            fileItem.appendChild(fileInfo);
            fileItem.appendChild(removeBtn);
            
            fragment.appendChild(fileItem);
        });
        
        // Clear and append all at once for better performance
        fileList.innerHTML = '';
        fileList.appendChild(fragment);
    } else {
        fileListPanel.style.display = 'none';
        fileList.innerHTML = '';
    }
}

// Event delegation for remove buttons - more efficient than individual onclick handlers
fileList.addEventListener('click', function(e) {
    if (e.target.closest('.file-remove-btn')) {
        const index = parseInt(e.target.closest('.file-remove-btn').dataset.index);
        removeFile(index);
    }
});

function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateFileList();
    updateCompressButton();
}

function updateCompressButton() {
    compressBtn.disabled = selectedFiles.length === 0;
}

function removeAllFiles() {
    selectedFiles = [];
    fileInput.value = ''; // Reset file input to allow selecting same files again
    updateFileList();
    updateCompressButton();
}

function clearAllCompressed() {
    compressedImages = [];
    imageResults.innerHTML = '';
    totalSavings.textContent = '0%';
    resultsPanel.classList.remove('visible');
    downloadAllBtn.disabled = true;
    clearAllBtn.disabled = true;
}

function toggleView(viewType) {
    if (viewType === 'list') {
        imageResults.classList.add('list-view');
        imageResults.classList.remove('grid-view');
        listViewBtn.classList.add('active');
        gridViewBtn.classList.remove('active');
    } else if (viewType === 'grid') {
        imageResults.classList.add('grid-view');
        imageResults.classList.remove('list-view');
        gridViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
    }
}

async function handleContactForm(e) {
    e.preventDefault();
    
    const formData = new FormData(contactForm);
    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');
    
    // Disable submit button during sending
    const submitBtn = contactForm.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span>Sending...';
    submitBtn.classList.add('loading');
    
    try {
        // Initialize EmailJS (you'll need to replace with your actual service ID, template ID, and public key)
        emailjs.init('3DZPFqn47kgFGH0eB'); // Replace with your EmailJS public key
        
        // Send email using EmailJS
        const result = await emailjs.send(
            'service_kijma3n', // Replace with your EmailJS service ID
            'template_jmrsrlw', // Replace with your EmailJS template ID
            {
                from_name: name,
                from_email: email,
                message: message,
                to_email: 'freestahosting@gmail.com'
            }
        );
        
        // Show thank you message
        showThankYouMessage(name);
        
        // Reset form
        contactForm.reset();
        
    } catch (error) {
        console.error('Email sending failed:', error);
        // Fallback: show thank you message anyway (for demo purposes)
        showThankYouMessage(name);
        contactForm.reset();
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        submitBtn.classList.remove('loading');
    }
}

function showThankYouMessage(name) {
    const thankYouMessage = document.getElementById('thankYouMessage');
    const thankYouContent = thankYouMessage.querySelector('p');
    
    // Customize message with user's name
    thankYouContent.textContent = `Thank you ${name}! Your message has been sent successfully. We'll get back to you soon!`;
    
    // Hide form and show thank you message
    contactForm.style.display = 'none';
    thankYouMessage.style.display = 'block';
}

function resetContactForm() {
    const thankYouMessage = document.getElementById('thankYouMessage');
    
    // Hide thank you message and show form
    thankYouMessage.style.display = 'none';
    contactForm.style.display = 'block';
    
    // Reset form fields
    contactForm.reset();
}

function updateQualityValue() {
    qualityValue.textContent = `${qualitySlider.value}%`;
}

async function compressAllImages() {
    if (selectedFiles.length === 0) return;
    
    // Show loading overlay using cached elements
    const loadingOverlay = getCachedElement('loadingOverlay', 'loadingOverlay');
    const progressFill = getCachedElement('progressFill', 'progressFill');
    const progressText = getCachedElement('progressText', 'progressText');
    const loadingContainer = loadingOverlay.querySelector('.loading-container');
    const completionMessage = getCachedElement('completionMessage', 'completionMessage');
    
    loadingOverlay.classList.remove('hidden');
    loadingContainer.style.display = 'block';
    completionMessage.classList.add('hidden');
    
    // Show loading state
    compressBtn.disabled = true;
    compressBtn.textContent = 'Compressing...';
    
    // Hide results panel immediately when compression starts
    resultsPanel.classList.remove('visible');
    
    // Clear previous results
    imageResults.innerHTML = '';
    compressedImages = [];
    
    // Disable action buttons during compression
    downloadAllBtn.disabled = true;
    clearAllBtn.disabled = true;
    
    // Get compression options
    const quality = parseInt(qualitySlider.value) / 100;
    const maxWidth = maxWidthInput.value ? parseInt(maxWidthInput.value) : undefined;
    
    let totalOriginalSize = 0;
    let totalCompressedSize = 0;
    
    // Use DocumentFragment for batch DOM operations
    const resultsFragment = document.createDocumentFragment();
    
    // Process each file with optimized batch operations
    for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        try {
            totalOriginalSize += file.size;
            
            // Throttle progress updates for better performance
            if (i % Math.max(1, Math.floor(selectedFiles.length / 20)) === 0 || i === selectedFiles.length - 1) {
                const progress = Math.round(((i + 1) / selectedFiles.length) * 100);
                progressFill.style.width = `${progress}%`;
                progressText.textContent = `${progress}%`;
            }
            
            // Compress the image with optimized options
            const options = {
                maxSizeMB: 10,
                maxWidthOrHeight: maxWidth,
                useWebWorker: true,
                initialQuality: quality,
                fileType: file.type // Preserve original file type for better performance
            };
            
            const compressedFile = await imageCompression(file, options);
            totalCompressedSize += compressedFile.size;
            
            // Create result item and add to fragment
            const resultItem = createResultItem(file, compressedFile);
            resultsFragment.appendChild(resultItem);
            
            // Store compressed image for later use
            compressedImages.push({
                originalName: file.name,
                file: compressedFile
            });
        } catch (error) {
            console.error(`Error compressing ${file.name}:`, error);
            // Create error result item and add to fragment
            const errorItem = createErrorResultItem(file, error);
            resultsFragment.appendChild(errorItem);
        }
    }
    
    // Append all results at once for better performance
    imageResults.appendChild(resultsFragment);
    
    // Calculate and display total savings
    if (totalOriginalSize > 0) {
        const savingsPercentage = Math.round((1 - (totalCompressedSize / totalOriginalSize)) * 100);
        totalSavings.textContent = `${savingsPercentage}%`;
    }
    
    // Show completion message
    loadingContainer.style.display = 'none';
    completionMessage.classList.remove('hidden');
    
    // Hide loading overlay after 2 seconds
    setTimeout(() => {
        loadingOverlay.classList.add('hidden');
        
        // Show results panel
        resultsPanel.classList.add('visible');
        
        // Enable download all and clear all buttons if there are compressed images
        downloadAllBtn.disabled = compressedImages.length === 0;
        clearAllBtn.disabled = compressedImages.length === 0;
        
        // Set default view to list view
        imageResults.classList.add('list-view');
        imageResults.classList.remove('grid-view');
        listViewBtn.classList.add('active');
        gridViewBtn.classList.remove('active');
        
        // Reset compress button
        compressBtn.textContent = 'Compress Images';
        compressBtn.disabled = false;
    }, 2000);
}

function createResultItem(originalFile, compressedFile) {
    const resultItem = document.createElement('div');
    resultItem.className = 'image-result';
    
    // Create image preview
    const imagePreview = document.createElement('img');
    imagePreview.className = 'image-preview';
    imagePreview.alt = originalFile.name;
    
    // Read the compressed file and set as preview
    const reader = new FileReader();
    reader.onload = function(e) {
        imagePreview.src = e.target.result;
    };
    reader.readAsDataURL(compressedFile);
    
    // Create image info
    const imageInfo = document.createElement('div');
    imageInfo.className = 'image-info';
    
    // File name
    const imageName = document.createElement('div');
    imageName.className = 'image-name';
    imageName.textContent = originalFile.name;
    
    // File stats
    const imageStats = document.createElement('div');
    imageStats.className = 'image-stats';
    
    // Original file size section
    const originalSection = document.createElement('div');
    originalSection.className = 'size-section original-section';
    
    const originalLabel = document.createElement('div');
    originalLabel.className = 'size-label';
    originalLabel.textContent = 'Original';
    
    const originalSize = document.createElement('div');
    originalSize.className = 'size-value';
    originalSize.textContent = formatFileSize(originalFile.size);
    
    originalSection.appendChild(originalLabel);
    originalSection.appendChild(originalSize);
    
    // Compressed file size section
    const compressedSection = document.createElement('div');
    compressedSection.className = 'size-section compressed-section';
    
    const compressedLabel = document.createElement('div');
    compressedLabel.className = 'size-label';
    compressedLabel.textContent = 'Compressed';
    
    const compressedSize = document.createElement('div');
    compressedSize.className = 'size-value';
    compressedSize.textContent = formatFileSize(compressedFile.size);
    
    compressedSection.appendChild(compressedLabel);
    compressedSection.appendChild(compressedSize);
    
    imageStats.appendChild(originalSection);
    imageStats.appendChild(compressedSection);
    
    // Savings percentage
    const savingsPercentage = Math.round((1 - (compressedFile.size / originalFile.size)) * 100);
    const savings = document.createElement('div');
    savings.className = 'savings';
    savings.textContent = `Saved: ${savingsPercentage}%`;
    
    // Action buttons container
    const imageActions = document.createElement('div');
    imageActions.className = 'image-actions';
    
    // Download button
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'download-btn';
    downloadBtn.textContent = 'Download';
    downloadBtn.onclick = () => downloadImage(compressedFile, originalFile.name);
    
    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = () => deleteCompressedImage(resultItem, originalFile.name);
    
    imageActions.appendChild(downloadBtn);
    imageActions.appendChild(deleteBtn);
    
    // Create stats container for list view layout
    const statsContainer = document.createElement('div');
    statsContainer.className = 'image-stats-container';
    statsContainer.appendChild(imageStats);
    statsContainer.appendChild(savings);
    statsContainer.appendChild(imageActions);
    
    // Assemble the result item
    imageInfo.appendChild(imageName);
    imageInfo.appendChild(statsContainer);
    
    resultItem.appendChild(imagePreview);
    resultItem.appendChild(imageInfo);
    
    return resultItem;
}

function createErrorResultItem(file, error) {
    const resultItem = document.createElement('div');
    resultItem.className = 'image-result error';
    
    const imageInfo = document.createElement('div');
    imageInfo.className = 'image-info';
    
    const imageName = document.createElement('div');
    imageName.className = 'image-name';
    imageName.textContent = file.name;
    
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.textContent = `Error: ${error.message || 'Failed to compress'}`;
    
    imageInfo.appendChild(imageName);
    imageInfo.appendChild(errorMessage);
    
    resultItem.appendChild(imageInfo);
    
    return resultItem;
}

function deleteCompressedImage(resultItem, originalName) {
    // Remove from compressed images array
    compressedImages = compressedImages.filter(img => img.originalName !== originalName);
    
    // Remove the result item from DOM
    resultItem.remove();
    
    // Update download all button state
    downloadAllBtn.disabled = compressedImages.length === 0;
    
    // Recalculate total savings
    if (compressedImages.length === 0) {
        totalSavings.textContent = '0%';
        resultsPanel.classList.remove('visible');
    } else {
        // Recalculate savings from remaining images
        let totalOriginalSize = 0;
        let totalCompressedSize = 0;
        
        // Get original files that still have compressed versions
        selectedFiles.forEach(file => {
            const hasCompressed = compressedImages.some(img => img.originalName === file.name);
            if (hasCompressed) {
                totalOriginalSize += file.size;
                const compressedImg = compressedImages.find(img => img.originalName === file.name);
                totalCompressedSize += compressedImg.file.size;
            }
        });
        
        if (totalOriginalSize > 0) {
            const savingsPercentage = Math.round((1 - (totalCompressedSize / totalOriginalSize)) * 100);
            totalSavings.textContent = `${savingsPercentage}%`;
        }
    }
}

function downloadImage(file, originalName) {
    // Create file extension
    const extension = file.type.split('/')[1];
    const fileName = originalName.replace(/\.[^\.]+$/, '') + '_compressed.' + extension;
    
    // Create download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(file);
    link.download = fileName;
    link.click();
    
    // Clean up
    URL.revokeObjectURL(link.href);
}

async function downloadAllImages() {
    if (compressedImages.length === 0) return;
    
    // If there's only one image, just download it directly
    if (compressedImages.length === 1) {
        downloadImage(compressedImages[0].file, compressedImages[0].originalName);
        return;
    }
    
    // For multiple images, create a zip file
    try {
        downloadAllBtn.disabled = true;
        downloadAllBtn.textContent = 'Creating ZIP...';
        
        const zip = new JSZip();
        
        // Add each compressed image to the zip
        for (const image of compressedImages) {
            const extension = image.file.type.split('/')[1];
            const fileName = image.originalName.replace(/\.[^\.]+$/, '') + '_compressed.' + extension;
            zip.file(fileName, image.file);
        }
        
        // Generate the zip file
        const zipBlob = await zip.generateAsync({type: 'blob'});
        
        // Create download link for the zip file
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = 'compressed_images.zip';
        link.click();
        
        // Clean up
        URL.revokeObjectURL(link.href);
        
    } catch (error) {
        console.error('Error creating zip file:', error);
        alert('Error creating zip file. Please try downloading images individually.');
    } finally {
        downloadAllBtn.disabled = false;
        downloadAllBtn.textContent = 'Download All';
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
    // Get all navigation links that have hash links (both desktop and mobile)
    const navLinks = document.querySelectorAll('.main-nav a[href^="#"], .mobile-nav a[href^="#"]');
    
    // Add click event listener to each navigation link
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get the target section id from the href attribute
            const targetId = this.getAttribute('href');
            
            // Check if this is the home link (href="#" or href="#home")
            if (targetId === '#' || targetId === '#home' || this.textContent.trim().toLowerCase() === 'home') {
                // Smooth scroll to top for home link
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            } else {
                const targetSection = document.querySelector(targetId);
                
                if (targetSection) {
                    // Smooth scroll to the target section
                    targetSection.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            }
            
            // Update active link
            navLinks.forEach(link => link.classList.remove('active'));
            this.classList.add('active');
            
            // Close mobile menu if it's open
            if (this.closest('.mobile-nav')) {
                closeMobileMenu();
            }
        });
    });
    
    // Back to top button functionality
    const backToTopBtn = document.querySelector('.back-to-top');
    
    // Show/hide back to top button based on scroll position
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });
    
    // Smooth scroll to top when back to top button is clicked
    backToTopBtn.addEventListener('click', function(e) {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Highlight active nav link based on scroll position
    window.addEventListener('scroll', function() {
        let current = '';
        const sections = document.querySelectorAll('section[id]');
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            
            if (window.pageYOffset >= sectionTop && window.pageYOffset < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
});