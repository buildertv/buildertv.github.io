class SqueezoProBatch {
    constructor() {
        this.selectedFiles = [];
        this.processedImages = new Map(); // imageId -> {original, compressed, imageId}
        this.processingTimeout = null;
        this.selectedImageIds = new Set();
        this.currentActiveImageId = null;
        this.isProcessing = false;
        this.lastQuality = 75;
        this.lastFormat = 'webp'; // Đổi mặc định thành webp
        this.batchUpdatePending = false;
        this.batchInfoUpdateTimer = null;
        this.currentProxyIndex = 0; // Lưu proxy đang sử dụng để tối ưu
        this.proxyTimeout = 5000; // Timeout 5 giây cho mỗi proxy
        
        this.initializeElements();
        this.setupDefaultSettings();
        this.bindEvents();
    }

    initializeElements() {
        this.elements = {
            uploadArea: document.getElementById('uploadArea'),
            fileInput: document.getElementById('fileInput'),
            settingsPanel: document.getElementById('settingsPanel'),
            welcomeScreen: document.getElementById('welcomeScreen'),
            comparisonView: document.getElementById('comparisonView'),
            thumbnailsSection: document.getElementById('thumbnailsSection'),
            sidebarRight: document.getElementById('sidebarRight'),
            
            // Settings
            qualitySlider: document.getElementById('qualitySlider'),
            qualityDisplay: document.getElementById('qualityDisplay'),
            formatSelect: document.getElementById('formatSelect'),
            
            // Batch info
            batchInfo: document.getElementById('batchInfo'),
            imageCount: document.getElementById('imageCount'),
            totalOriginalSize: document.getElementById('totalOriginalSize'),
            totalCompressedSize: document.getElementById('totalCompressedSize'),
            totalSaved: document.getElementById('totalSaved'),
            
            // Comparison view
            originalImage: document.getElementById('originalImage'),
            compressedImage: document.getElementById('compressedImage'),
            originalSize: document.getElementById('originalSize'),
            compressedSize: document.getElementById('compressedSize'),
            originalDimensions: document.getElementById('originalDimensions'),
            savedPercent: document.getElementById('savedPercent'),
            
            // Thumbnails
            thumbnailsGrid: document.getElementById('thumbnailsGrid'),
            thumbnailCount: document.getElementById('thumbnailCount'),
            selectAllBtn: document.getElementById('selectAllBtn'),
            deselectAllBtn: document.getElementById('deselectAllBtn'),
            
            // Progress
            processingProgress: document.getElementById('processingProgress'),
            progressFill: document.getElementById('progressFill'),
            progressText: document.getElementById('progressText'),
            
            // Buttons
            downloadAllBtn: document.getElementById('downloadAllBtn'),
            clearAllBtn: document.getElementById('clearAllBtn'),
            
            // Canvas & Modal
            canvas: document.getElementById('processingCanvas'),
            modalOverlay: document.getElementById('modalOverlay'),
            modalBody: document.getElementById('modalBody'),
            loadingToast: document.getElementById('loadingToast')
        };
    }
    
    // Thiết lập các giá trị mặc định
    setupDefaultSettings() {
        if (this.elements.qualitySlider) {
            this.elements.qualitySlider.value = this.lastQuality;
            this.elements.qualityDisplay.textContent = this.lastQuality + '%';
        }
        
        if (this.elements.formatSelect) {
            this.elements.formatSelect.value = this.lastFormat;
        }
    }

    bindEvents() {
        // Upload events
        this.elements.uploadArea.addEventListener('click', (e) => {
            // Nếu click vào nút URL, không mở file picker
            if (e.target.closest('#urlUploadBtn')) {
                this.openUrlModal();
                e.stopPropagation();
            } else {
                this.elements.fileInput.click();
            }
        });
        this.elements.uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        this.elements.uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.elements.uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        this.elements.fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // URL Upload events
        document.getElementById('urlUploadBtn').addEventListener('click', this.openUrlModal.bind(this));
        document.getElementById('previewUrlBtn').addEventListener('click', this.previewUrlImage.bind(this));
        document.getElementById('addUrlImageBtn').addEventListener('click', this.addUrlImage.bind(this));
        document.getElementById('imageUrl').addEventListener('input', this.onUrlInputChange.bind(this));
        document.getElementById('imageUrl').addEventListener('paste', () => {
            // Cho phép preview tự động sau khi paste
            setTimeout(() => this.previewUrlImage(), 100);
        });
        // Thêm phím tắt Enter để xem trước
        document.getElementById('imageUrl').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.previewUrlImage();
            }
        });

        // Settings events - Cập nhật để xử lý ngay lập tức
        this.elements.qualitySlider.addEventListener('input', this.handleQualityChange.bind(this));
        this.elements.qualitySlider.addEventListener('change', this.handleQualityChangeEnd.bind(this));
        this.elements.formatSelect.addEventListener('change', this.handleFormatChange.bind(this));

        // Control buttons
        this.elements.selectAllBtn.addEventListener('click', this.selectAllImages.bind(this));
        this.elements.deselectAllBtn.addEventListener('click', this.deselectAllImages.bind(this));
        this.elements.downloadAllBtn.addEventListener('click', this.downloadSelectedImages.bind(this));
        this.elements.clearAllBtn.addEventListener('click', this.clearAllImages.bind(this));

        // Prevent default drag on document
        document.addEventListener('dragover', e => e.preventDefault());
        document.addEventListener('drop', e => e.preventDefault());
    }

    // Thêm các phương thức mới để xử lý URL upload
    openUrlModal() {
        const modal = document.getElementById('urlModalOverlay');
        modal.style.display = 'flex';
        
        // Reset modal
        document.getElementById('imageUrl').value = '';
        document.getElementById('previewImage').style.display = 'none';
        document.getElementById('urlError').style.display = 'none';
        document.querySelector('.preview-placeholder').style.display = 'flex';
        document.getElementById('addUrlImageBtn').disabled = true;
        
        // Focus vào input để người dùng có thể dán ngay
        setTimeout(() => {
            document.getElementById('imageUrl').focus();
        }, 100);
    }

    onUrlInputChange() {
        // Reset trạng thái preview khi người dùng thay đổi URL
        document.getElementById('previewImage').style.display = 'none';
        document.getElementById('urlError').style.display = 'none';
        document.querySelector('.preview-placeholder').style.display = 'flex';
        document.getElementById('addUrlImageBtn').disabled = true;
    }

    previewUrlImage() {
        const urlInput = document.getElementById('imageUrl');
        const previewImg = document.getElementById('previewImage');
        const placeholder = document.querySelector('.preview-placeholder');
        const errorEl = document.getElementById('urlError');
        const errorMessage = document.getElementById('urlErrorMessage');
        const addButton = document.getElementById('addUrlImageBtn');
        const previewButton = document.getElementById('previewUrlBtn');
        
        // Reset trạng thái
        previewImg.style.display = 'none';
        errorEl.style.display = 'none';
        placeholder.style.display = 'flex';
        addButton.disabled = true;
        
        // Thay đổi trạng thái nút xem trước
        previewButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang tải...';
        previewButton.disabled = true;
        
        const url = urlInput.value.trim();
        
        if (!url) {
            errorMessage.textContent = 'Vui lòng nhập URL hình ảnh';
            errorEl.style.display = 'flex';
            this.resetPreviewButton(previewButton);
            return;
        }
        
        // Chuẩn hóa URL
        try {
            const normalizedUrl = this.normalizeImageUrl(url);
            urlInput.value = normalizedUrl; // Cập nhật lại input với URL đã chuẩn hóa
        } catch (e) {
            errorMessage.textContent = 'URL không hợp lệ';
            errorEl.style.display = 'flex';
            this.resetPreviewButton(previewButton);
            return;
        }
        
        // Hiển thị loading
        placeholder.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Đang tải...</span>';
        
        // Đặt lại proxy index để thử từ đầu
        this.currentProxyIndex = 0;
        
        // Thử tải ảnh với phương pháp nhanh nhất trước
        this.fastImagePreview(url)
            .then(success => {
                if (success) {
                    addButton.disabled = false;
                } else {
                    // Nếu phương pháp nhanh thất bại, thử phương pháp sử dụng proxy
                    return this.fetchImageAsBlob(url, true);
                }
            })
            .then(blob => {
                if (blob && blob instanceof Blob) {
                    // Tạo URL từ blob
                    const blobUrl = URL.createObjectURL(blob);
                    previewImg.src = blobUrl;
                    previewImg.style.display = 'block';
                    placeholder.style.display = 'none';
                    addButton.disabled = false;
                    
                    // Lưu URL blob để sử dụng khi thêm ảnh
                    previewImg.dataset.blobUrl = blobUrl;
                }
            })
            .catch(error => {
                console.error('Lỗi khi tải ảnh preview:', error);
                errorMessage.textContent = error.message || 'Không thể tải hình ảnh từ URL này';
                errorEl.style.display = 'flex';
                placeholder.innerHTML = '<i class="fas fa-image"></i><span>Xem trước ảnh</span>';
            })
            .finally(() => {
                this.resetPreviewButton(previewButton);
            });
    }
    
    // Hàm để reset trạng thái nút preview
    resetPreviewButton(button) {
        button.innerHTML = '<i class="fas fa-eye"></i> Xem trước';
        button.disabled = false;
    }
    
    // Phương pháp tải ảnh nhanh nhất - trả về true nếu thành công
    fastImagePreview(url) {
        return new Promise((resolve) => {
            const previewImg = document.getElementById('previewImage');
            const placeholder = document.querySelector('.preview-placeholder');
            
            // Tạo một URL mới không có tham số để tránh cache
            const nocacheUrl = this.addNoCacheParam(url);
            
            // Thử tải ảnh trực tiếp
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            // Đặt timeout để không chờ quá lâu
            const timeout = setTimeout(() => {
                img.src = ""; // Hủy tải
                resolve(false);
            }, 3000);
            
            img.onload = () => {
                clearTimeout(timeout);
                
                // Ảnh tải thành công
                previewImg.src = nocacheUrl;
                previewImg.style.display = 'block';
                placeholder.style.display = 'none';
                
                resolve(true);
            };
            
            img.onerror = () => {
                clearTimeout(timeout);
                resolve(false);
            };
            
            img.src = nocacheUrl;
        });
    }

    // Phương thức cải tiến fetchImageAsBlob để xử lý tốt hơn vấn đề CORS
    async fetchImageAsBlob(url, isForPreview = false) {
        try {
            // Chuẩn hóa URL
            url = this.normalizeImageUrl(url);
            
            // Danh sách các proxy CORS để thử lần lượt
            const corsProxies = [
                'https://corsproxy.io/?',
                'https://api.codetabs.com/v1/proxy?quest=',
                'https://cors-anywhere.herokuapp.com/',
                'https://api.allorigins.win/raw?url=',
                'https://cors-proxy.htmldriven.com/?url='
            ];
            
            // Thử tải trực tiếp trước (nếu không phải preview)
            if (!isForPreview) {
                try {
                    console.log("Đang thử tải trực tiếp URL:", url);
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), this.proxyTimeout);
                    
                    const response = await fetch(url, { 
                        mode: 'cors',
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (response.ok) {
                        const blob = await response.blob();
                        console.log("Tải trực tiếp thành công!");
                        return blob;
                    }
                } catch (directError) {
                    console.warn('Không thể tải trực tiếp:', directError);
                }
            }
            
            // Nếu tải trực tiếp thất bại, thử từ proxy đã biết là hoạt động
            if (this.currentProxyIndex > 0 && this.currentProxyIndex < corsProxies.length) {
                try {
                    const proxy = corsProxies[this.currentProxyIndex];
                    console.log(`Đang thử proxy đã biết: ${proxy}`);
                    
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), this.proxyTimeout);
                    
                    const proxyUrl = proxy + encodeURIComponent(url);
                    const proxyResponse = await fetch(proxyUrl, { signal: controller.signal });
                    
                    clearTimeout(timeoutId);
                    
                    if (proxyResponse.ok) {
                        const blob = await proxyResponse.blob();
                        if (blob.type.startsWith('image/')) {
                            console.log(`Tải thành công qua proxy: ${proxy}`);
                            return blob;
                        }
                    }
                } catch (knownProxyError) {
                    console.warn(`Lỗi với proxy đã biết:`, knownProxyError);
                    // Nếu proxy đã biết không hoạt động, tiếp tục thử các proxy khác
                }
            }
            
            // Thử lần lượt các proxy còn lại
            for (let i = 0; i < corsProxies.length; i++) {
                // Bỏ qua proxy đã thử
                if (i === this.currentProxyIndex) continue;
                
                try {
                    const proxy = corsProxies[i];
                    console.log(`Đang thử proxy: ${proxy}`);
                    
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), this.proxyTimeout);
                    
                    const proxyUrl = proxy + encodeURIComponent(url);
                    const proxyResponse = await fetch(proxyUrl, { signal: controller.signal });
                    
                    clearTimeout(timeoutId);
                    
                    if (proxyResponse.ok) {
                        const blob = await proxyResponse.blob();
                        
                        // Kiểm tra xem blob có phải là hình ảnh không
                        if (blob.type.startsWith('image/')) {
                            console.log(`Tải thành công qua proxy: ${proxy}`);
                            this.currentProxyIndex = i; // Lưu lại proxy hoạt động
                            return blob;
                        } else {
                            console.warn(`Nội dung tải về không phải hình ảnh: ${blob.type}`);
                            continue; // Thử proxy tiếp theo
                        }
                    }
                } catch (proxyError) {
                    console.warn(`Lỗi với proxy ${corsProxies[i]}:`, proxyError);
                    // Tiếp tục thử proxy tiếp theo
                }
            }
            
            // Nếu thử tất cả proxy không thành công, thử phương pháp Image()
            try {
                console.log("Đang thử phương pháp Image()");
                const imgBlob = await this.fetchImageUsingImageObject(url);
                if (imgBlob) {
                    return imgBlob;
                }
            } catch (imgError) {
                console.warn("Lỗi khi sử dụng phương pháp Image():", imgError);
            }
            
            // Nếu tất cả các cách thất bại
            throw new Error('Không thể tải ảnh từ URL này. Hãy thử URL khác hoặc tải ảnh lên từ máy tính của bạn.');
            
        } catch (error) {
            console.error('Lỗi khi tải ảnh:', error);
            throw new Error(error.message || 'Không thể tải ảnh từ URL này');
        }
    }

    // Phương thức để tải ảnh sử dụng đối tượng Image
    fetchImageUsingImageObject(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            // Đảm bảo có thể tải ảnh từ domain khác
            img.crossOrigin = 'anonymous';
            
            // Đặt timeout để tránh chờ quá lâu
            const timeout = setTimeout(() => {
                reject(new Error('Tải ảnh quá thời gian'));
            }, this.proxyTimeout);
            
            img.onload = () => {
                clearTimeout(timeout);
                try {
                    // Tạo canvas và vẽ ảnh lên nó
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    
                    // Chuyển đổi canvas thành blob
                    canvas.toBlob(blob => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Không thể tạo blob từ ảnh'));
                        }
                    }, 'image/png');
                } catch (error) {
                    reject(error);
                }
            };
            
            img.onerror = () => {
                clearTimeout(timeout);
                reject(new Error('Không thể tải ảnh'));
            };
            
            // Đặt src sau khi đã thiết lập các handler
            img.src = this.addNoCacheParam(url);
            
            // Nếu ảnh đã được cache, onload có thể không được gọi
            if (img.complete) {
                img.onload();
            }
        });
    }

    // Phương thức để chuẩn hóa URL
    normalizeImageUrl(url) {
        try {
            // Loại bỏ khoảng trắng
            url = url.trim();
            
            // Thêm protocol nếu thiếu
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }
            
            // URL constructor để kiểm tra tính hợp lệ
            new URL(url);
            
            return url;
        } catch (e) {
            throw new Error('URL không hợp lệ');
        }
    }

    // Thêm tham số để tránh cache
    addNoCacheParam(url) {
        try {
            const urlObj = new URL(url);
            urlObj.searchParams.append('_nocache', Date.now());
            return urlObj.toString();
        } catch (e) {
            return url;
        }
    }

    // Phương thức addUrlImage cải tiến
    async addUrlImage() {
        const url = document.getElementById('imageUrl').value.trim();
        const previewImg = document.getElementById('previewImage');
        const addButton = document.getElementById('addUrlImageBtn');
        
        if (!url || addButton.disabled) {
            return;
        }
        
        // Đổi trạng thái nút
        addButton.disabled = true;
        addButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
        
        try {
            let imageBlob;
            
            // Kiểm tra xem đã có blob URL được lưu từ preview chưa
            if (previewImg.dataset.blobUrl) {
                try {
                    // Tìm blob từ URL đã lưu
                    const response = await fetch(previewImg.dataset.blobUrl);
                    imageBlob = await response.blob();
                } catch (blobError) {
                    console.warn('Không thể sử dụng blob đã lưu:', blobError);
                    // Nếu có lỗi khi lấy blob đã lưu, tải lại ảnh từ URL
                    imageBlob = await this.fetchImageAsBlob(url);
                }
            } else {
                // Tải ảnh từ URL
                imageBlob = await this.fetchImageAsBlob(url);
            }
            
            // Kiểm tra blob đã tải
            if (!imageBlob || !imageBlob.type.startsWith('image/')) {
                throw new Error('Dữ liệu tải về không phải hình ảnh');
            }
            
            // Tạo File object từ Blob
            const filename = this.getFilenameFromUrl(url);
            const file = new File([imageBlob], filename, { type: imageBlob.type });
            
            // Đóng modal
            closeUrlModal();
            
            // Xử lý file giống như upload từ máy tính
            this.processFiles([file]);
            
            // Hiển thị thông báo thành công
            this.showToast('Đã thêm ảnh từ URL thành công');
            
            // Xóa blob URL đã lưu để tránh rò rỉ bộ nhớ
            if (previewImg.dataset.blobUrl) {
                URL.revokeObjectURL(previewImg.dataset.blobUrl);
                delete previewImg.dataset.blobUrl;
            }
            
        } catch (error) {
            console.error('Lỗi khi tải ảnh từ URL:', error);
            
            // Hiển thị lỗi
            const errorEl = document.getElementById('urlError');
            const errorMessage = document.getElementById('urlErrorMessage');
            errorMessage.textContent = 'Lỗi khi tải ảnh: ' + (error.message || 'Không xác định');
            errorEl.style.display = 'flex';
            
        } finally {
            // Khôi phục trạng thái nút
            addButton.disabled = false;
            addButton.innerHTML = '<i class="fas fa-plus"></i> Thêm ảnh';
        }
    }

    getFilenameFromUrl(url) {
        try {
            // Lấy tên file từ URL
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            let filename = pathname.split('/').pop() || 'image';
            
            // Nếu không có phần mở rộng, thêm .jpg
            if (!filename.includes('.')) {
                filename += '.jpg';
            }
            
            return filename;
        } catch (e) {
            // Nếu URL không hợp lệ, trả về tên mặc định
            return 'image_from_url.jpg';
        }
    }

    // File handling
    handleDragOver(e) {
        e.preventDefault();
        this.elements.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.elements.uploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.elements.uploadArea.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
        if (files.length > 0) {
            this.processFiles(files);
        }
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
        if (files.length > 0) {
            this.processFiles(files);
        }
    }

    processFiles(files) {
        const startIndex = this.selectedFiles.length;
        this.selectedFiles = [...this.selectedFiles, ...files];
        this.showComparisonView();
        this.renderThumbnails(files, startIndex);
        this.updateBatchInfo();
        this.startBatchCompression(files, startIndex);
    }

    showComparisonView() {
        this.elements.welcomeScreen.style.display = 'none';
        this.elements.comparisonView.style.display = 'flex';
        this.elements.thumbnailsSection.style.display = 'block';
        this.elements.settingsPanel.style.display = 'block';
        this.elements.batchInfo.style.display = 'block';
        this.elements.sidebarRight.style.display = 'block';
    }

    renderThumbnails(files = this.selectedFiles, startIndex = 0) {
        files.forEach((file, index) => {
            const actualIndex = startIndex + index;
            const imageId = `img-${Date.now()}-${actualIndex}`;
            
            const thumbnail = document.createElement('div');
            thumbnail.className = 'thumbnail-item';
            thumbnail.dataset.imageId = imageId;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                thumbnail.innerHTML = `
                    <div class="thumbnail-actions">
                        <div class="thumbnail-checkbox checked" onclick="window.SqueezoPro.toggleImageSelection('${imageId}', event)"></div>
                        <div class="thumbnail-delete" onclick="window.SqueezoPro.deleteImage('${imageId}', event)">
                            <i class="fas fa-times"></i>
                        </div>
                    </div>
                    <img src="${e.target.result}" alt="${file.name}" class="thumbnail-image">
                    <div class="thumbnail-info">${this.formatFileSize(file.size)}</div>
                `;
                
                // Click event để hiển thị comparison
                thumbnail.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('thumbnail-checkbox') && 
                        !e.target.classList.contains('thumbnail-delete') && 
                        !e.target.closest('.thumbnail-delete')) {
                        this.showImageComparison(imageId, file, e.target.src || e.target.querySelector('img').src);
                    }
                });
                
                // Đảm bảo checkbox được chọn và thêm class selected
                thumbnail.classList.add('selected');
            };
            reader.readAsDataURL(file);
            
            this.elements.thumbnailsGrid.appendChild(thumbnail);
            
            // Auto-select new images
            this.selectedImageIds.add(imageId);
        });

        this.updateThumbnailCount();
    }

    findImageIdByFile(file) {
        // Tìm imageId từ file
        for (const [id, data] of this.processedImages.entries()) {
            if (data.original === file) {
                return id;
            }
        }
        
        // Nếu không tìm thấy trong processedImages
        const thumbnails = Array.from(this.elements.thumbnailsGrid.children);
        const fileIndex = this.selectedFiles.indexOf(file);
        
        if (fileIndex >= 0 && fileIndex < thumbnails.length) {
            return thumbnails[fileIndex].dataset.imageId;
        }
        
        return null;
    }

    showImageComparison(imageId, originalFile, originalDataUrl) {
        // Update active state
        document.querySelectorAll('.thumbnail-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const thumbnailElement = document.querySelector(`[data-image-id="${imageId}"]`);
        if (thumbnailElement) {
            thumbnailElement.classList.add('active');
        }
        
        this.currentActiveImageId = imageId;
        
        // Show original image
        this.elements.originalImage.src = originalDataUrl;
        this.elements.originalSize.textContent = this.formatFileSize(originalFile.size);
        
        // Get image dimensions
        const img = new Image();
        img.onload = () => {
            this.elements.originalDimensions.textContent = `${img.width} x ${img.height}`;
        };
        img.src = originalDataUrl;
        
        // Kiểm tra nếu định dạng hoặc chất lượng đã thay đổi
        const currentQuality = parseInt(this.elements.qualitySlider.value);
        const currentFormat = this.elements.formatSelect.value;
        const needsRecompression = currentQuality !== this.lastQuality || currentFormat !== this.lastFormat;
        
        // Show compressed image if available
        const processed = this.processedImages.get(imageId);
        if (processed && !needsRecompression) {
            this.elements.compressedImage.src = processed.compressed.dataUrl;
            this.elements.compressedSize.textContent = this.formatFileSize(processed.compressed.size);
            
            // Đảm bảo tính toán đúng % tiết kiệm
            const saved = originalFile.size - processed.compressed.size;
            const savedPercent = (saved / originalFile.size * 100).toFixed(1);
            
            this.elements.savedPercent.textContent = savedPercent + '%';
            
            // Kiểm tra và thêm màu sắc phù hợp
            if (saved < 0) {
                this.elements.savedPercent.style.color = 'var(--accent-red)';
            } else {
                this.elements.savedPercent.style.color = 'var(--accent-green)';
            }
        } else {
            // Show placeholder hoặc loading state
            this.elements.compressedImage.src = originalDataUrl;
            this.elements.compressedSize.textContent = 'Đang xử lý...';
            this.elements.savedPercent.textContent = '...';
            
            // Nén ngay khi hiển thị ảnh mới hoặc khi cần nén lại
            this.compressCurrentImage();
        }
        
        // Cập nhật lại thông tin batch để đảm bảo hiển thị đúng
        this.scheduleBatchInfoUpdate();
        
        // Hiển thị/ẩn thanh trượt chất lượng dựa vào định dạng
        this.updateQualitySliderVisibility();
    }

    // Thêm hàm xóa một ảnh
    deleteImage(imageId, event) {
        if (event) {
            event.stopPropagation();
        }
        
        // Tìm thumbnail để xóa
        const thumbnail = document.querySelector(`[data-image-id="${imageId}"]`);
        if (!thumbnail) return;
        
        // Tìm file gốc từ processed images
        const processed = this.processedImages.get(imageId);
        let originalFile = null;
        
        if (processed) {
            originalFile = processed.original;
        }
        
        // Xóa khỏi selectedFiles nếu tìm thấy
        if (originalFile) {
            const fileIndex = this.selectedFiles.indexOf(originalFile);
            if (fileIndex > -1) {
                this.selectedFiles.splice(fileIndex, 1);
            }
        }
        
        // Xóa khỏi processedImages
        this.processedImages.delete(imageId);
        
        // Xóa khỏi selectedImageIds
        this.selectedImageIds.delete(imageId);
        
        // Xóa khỏi DOM
        thumbnail.remove();
        
        // Nếu là ảnh đang active, hiển thị ảnh khác
        if (this.currentActiveImageId === imageId) {
            this.currentActiveImageId = null;
            
            // Hiển thị ảnh đầu tiên nếu còn ảnh
            const firstThumbnail = document.querySelector('.thumbnail-item');
            if (firstThumbnail) {
                const firstImageId = firstThumbnail.dataset.imageId;
                const firstProcessed = this.processedImages.get(firstImageId);
                if (firstProcessed) {
                    this.showImageComparison(
                        firstImageId, 
                        firstProcessed.original, 
                        firstThumbnail.querySelector('img').src
                    );
                } else {
                    // Nếu chưa có thông tin processed, lấy file từ selectedFiles
                    const firstFile = this.selectedFiles[0];
                    if (firstFile) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            this.showImageComparison(firstImageId, firstFile, e.target.result);
                        };
                        reader.readAsDataURL(firstFile);
                    }
                }
            } else {
                // Nếu không còn ảnh nào, quay về màn hình welcome
                this.elements.welcomeScreen.style.display = 'flex';
                this.elements.comparisonView.style.display = 'none';
                this.elements.thumbnailsSection.style.display = 'none';
                this.elements.settingsPanel.style.display = 'none';
                this.elements.batchInfo.style.display = 'none';
                this.elements.sidebarRight.style.display = 'none';
            }
        }
        
        this.updateThumbnailCount();
        this.scheduleBatchInfoUpdate();
        this.updateActionButtons();
    }

    toggleImageSelection(imageId, event) {
        event.stopPropagation();
        
        const thumbnail = document.querySelector(`[data-image-id="${imageId}"]`);
        const checkbox = thumbnail.querySelector('.thumbnail-checkbox');
        
        if (this.selectedImageIds.has(imageId)) {
            this.selectedImageIds.delete(imageId);
            checkbox.classList.remove('checked');
            thumbnail.classList.remove('selected');
        } else {
            this.selectedImageIds.add(imageId);
            checkbox.classList.add('checked');
            thumbnail.classList.add('selected');
        }
        
        this.updateActionButtons();
        
        // Debug để kiểm tra các ảnh được chọn
        console.log(`Đã ${this.selectedImageIds.has(imageId) ? 'chọn' : 'bỏ chọn'} ảnh ID: ${imageId}`);
        console.log(`Số lượng ảnh đã chọn: ${this.selectedImageIds.size}`);
    }

    selectAllImages() {
        document.querySelectorAll('.thumbnail-item').forEach(thumbnail => {
            const imageId = thumbnail.dataset.imageId;
            const checkbox = thumbnail.querySelector('.thumbnail-checkbox');
            
            this.selectedImageIds.add(imageId);
            checkbox.classList.add('checked');
            thumbnail.classList.add('selected');
        });
        this.updateActionButtons();
        console.log(`Đã chọn tất cả ${this.selectedImageIds.size} ảnh`);
    }

    deselectAllImages() {
        document.querySelectorAll('.thumbnail-item').forEach(thumbnail => {
            const imageId = thumbnail.dataset.imageId;
            const checkbox = thumbnail.querySelector('.thumbnail-checkbox');
            
            this.selectedImageIds.delete(imageId);
            checkbox.classList.remove('checked');
            thumbnail.classList.remove('selected');
        });
        this.updateActionButtons();
        console.log("Đã bỏ chọn tất cả ảnh");
    }

    updateActionButtons() {
        const hasSelected = this.selectedImageIds.size > 0;
        this.elements.downloadAllBtn.style.display = hasSelected ? 'flex' : 'none';
        this.elements.clearAllBtn.style.display = this.selectedFiles.length > 0 ? 'flex' : 'none';
    }

    updateThumbnailCount() {
        this.elements.thumbnailCount.textContent = this.selectedFiles.length;
    }
    
    // Hiển thị/ẩn thanh trượt chất lượng dựa vào định dạng
    updateQualitySliderVisibility() {
        const format = this.elements.formatSelect.value;
        const sliderContainer = this.elements.qualitySlider.closest('.settings-group');
        
        if (format === 'png') {
            // Thêm thông báo vào bên cạnh thanh trượt
            const noticeEl = document.getElementById('png-notice');
            if (!noticeEl) {
                const notice = document.createElement('div');
                notice.id = 'png-notice';
                notice.className = 'png-format-notice';
                notice.innerHTML = '<i class="fas fa-info-circle"></i> PNG không dùng nén chất lượng';
                notice.style.cssText = 'color: var(--text-muted); font-size: 0.8rem; margin-top: 5px; font-style: italic;';
                sliderContainer.appendChild(notice);
            }
            
            // Vẫn hiển thị thanh trượt nhưng làm mờ đi
            this.elements.qualitySlider.style.opacity = '0.5';
            this.elements.qualitySlider.title = 'PNG không sử dụng cài đặt chất lượng';
        } else {
            // Xóa thông báo nếu có
            const noticeEl = document.getElementById('png-notice');
            if (noticeEl) {
                noticeEl.remove();
            }
            
            // Hiển thị bình thường
            this.elements.qualitySlider.style.opacity = '1';
            this.elements.qualitySlider.title = '';
        }
    }

    // Settings handlers - Cập nhật để xử lý ngay lập tức
    handleQualityChange(e) {
        const value = e.target.value;
        this.elements.qualityDisplay.textContent = value + '%';
        
        const format = this.elements.formatSelect.value;
        if (format === 'png') {
            // Với PNG, thanh quality không có tác dụng
            return;
        }
        
        // Xử lý ngay lập tức mà không hiển thị tiến trình
        if (this.currentActiveImageId) {
            // Đặt timeout để tránh quá nhiều lần nén khi kéo thanh trượt nhanh
            clearTimeout(this.processingTimeout);
            
            // Chỉ cập nhật UI hiển thị nhanh
            this.processingTimeout = setTimeout(() => {
                // Lưu lại chất lượng hiện tại
                this.lastQuality = parseInt(value);
                
                // Xử lý nén cho ảnh hiện tại mà không cập nhật batch info
                this.compressCurrentImage(true);
                
                // Đánh dấu cần cập nhật batch info
                this.batchUpdatePending = true;
            }, 30); // Giảm thời gian chờ để phản hồi nhanh hơn
        }
    }
    
    // Thêm event handler mới cho khi kết thúc kéo thanh trượt
    handleQualityChangeEnd(e) {
        const format = this.elements.formatSelect.value;
        if (format === 'png') {
            // Với PNG, thanh quality không có tác dụng
            return;
        }
        
        // Khi người dùng kết thúc kéo thanh trượt, thực hiện nén toàn bộ và cập nhật batch info
        clearTimeout(this.processingTimeout);
        
        // Giảm thời gian chờ để phản hồi nhanh hơn
        this.processingTimeout = setTimeout(() => {
            // Nén tất cả ảnh và cập nhật batch info
            this.recompressAllImages(false);
            
            // Đặt lại trạng thái pending
            this.batchUpdatePending = false;
        }, 100);
    }

    handleFormatChange() {
        // Cập nhật UI dựa trên định dạng đã chọn
        this.updateQualitySliderVisibility();
        
        // Sửa lại để xử lý khi thay đổi định dạng
        if (this.currentActiveImageId) {
            // Lưu lại định dạng hiện tại
            this.lastFormat = this.elements.formatSelect.value;
            
            // Xử lý nén cho ảnh hiện tại ngay lập tức
            clearTimeout(this.processingTimeout);
            this.processingTimeout = setTimeout(() => {
                this.compressCurrentImage(false); // Cập nhật ngay UI
                
                // Cập nhật lại tất cả ảnh với định dạng mới
                setTimeout(() => {
                    this.recompressAllImages(false);
                }, 50);
            }, 30);
        }
    }
    
    // Cập nhật để xử lý nén PNG đúng cách
    calculateCompressionOptions(format, quality) {
        let mimeType, compressionQuality;
        
        switch(format) {
            case 'png':
                mimeType = 'image/png';
                // PNG không dùng quality để nén ảnh, luôn giữ chất lượng tối đa
                compressionQuality = undefined; // Không truyền tham số này cho PNG
                break;
            case 'webp':
                mimeType = 'image/webp';
                compressionQuality = quality;
                break;
            default: // jpeg
                mimeType = 'image/jpeg';
                compressionQuality = quality;
        }
        
        return { mimeType, compressionQuality };
    }
    
    // Lên lịch cập nhật thông tin batch với debounce để tránh gọi quá nhiều lần
    scheduleBatchInfoUpdate() {
        clearTimeout(this.batchInfoUpdateTimer);
        this.batchInfoUpdateTimer = setTimeout(() => {
            this.updateBatchInfo();
        }, 50); // Cập nhật sau 50ms
    }
    
    // Hàm nén ngay lập tức ảnh đang hiển thị
    async compressCurrentImage(skipBatchUpdate = false) {
        if (!this.currentActiveImageId || this.isProcessing) return;
        
        // Tìm ảnh gốc từ currentActiveImageId
        let originalFile = null;
        const existingProcessed = this.processedImages.get(this.currentActiveImageId);
        
        if (existingProcessed) {
            originalFile = existingProcessed.original;
        } else {
            // Tìm file từ thumbnail
            const thumbnail = document.querySelector(`[data-image-id="${this.currentActiveImageId}"]`);
            if (!thumbnail) return;
            
            // Tìm vị trí của thumbnail trong danh sách
            const thumbnails = Array.from(this.elements.thumbnailsGrid.children);
            const index = thumbnails.indexOf(thumbnail);
            
            if (index >= 0 && index < this.selectedFiles.length) {
                originalFile = this.selectedFiles[index];
            }
        }
        
        if (!originalFile) return;
        
        try {
            this.isProcessing = true;
            // Hiển thị trạng thái đang xử lý cho phần compressed image
            this.elements.compressedSize.textContent = 'Đang xử lý...';
            this.elements.savedPercent.textContent = '...';
            
            const quality = parseInt(this.elements.qualitySlider.value) / 100;
            const format = this.elements.formatSelect.value;
            
            const compressed = await this.compressImage(originalFile, quality, format);
            
            // Cập nhật processed images map
            this.processedImages.set(this.currentActiveImageId, {
                original: originalFile,
                compressed: compressed,
                imageId: this.currentActiveImageId
            });
            
            // Cập nhật UI
            if (compressed && compressed.dataUrl) {
                this.elements.compressedImage.src = compressed.dataUrl;
                this.elements.compressedSize.textContent = this.formatFileSize(compressed.size);
                
                // Đảm bảo tính toán chính xác % tiết kiệm
                const saved = originalFile.size - compressed.size;
                const savedPercent = (saved / originalFile.size * 100).toFixed(1);
                
                this.elements.savedPercent.textContent = savedPercent + '%';
                
                // Đặt màu sắc dựa trên giá trị tiết kiệm
                if (saved < 0) {
                    this.elements.savedPercent.style.color = 'var(--accent-red)';
                } else {
                    this.elements.savedPercent.style.color = 'var(--accent-green)';
                }
            } else {
                // Xử lý trường hợp có lỗi
                this.elements.compressedSize.textContent = 'Lỗi xử lý';
                this.elements.savedPercent.textContent = '0%';
                this.elements.savedPercent.style.color = 'var(--text-muted)';
            }
            
            // Cập nhật thông tin batch chỉ khi cần thiết
            if (!skipBatchUpdate) {
                this.scheduleBatchInfoUpdate();
            }
            
        } catch (error) {
            console.error('Lỗi khi nén ảnh:', error);
            this.elements.compressedSize.textContent = 'Lỗi xử lý';
            this.elements.savedPercent.textContent = '0%';
        } finally {
            this.isProcessing = false;
        }
    }

    async recompressAllImages(showProgress = true) {
        if (this.selectedFiles.length === 0) return;
        if (this.isProcessing) {
            setTimeout(() => this.recompressAllImages(showProgress), 100);
            return;
        }

        this.isProcessing = true;
        if (showProgress) {
            this.showProcessingProgress();
        }
        
        const quality = parseInt(this.elements.qualitySlider.value) / 100;
        const format = this.elements.formatSelect.value;
        
        // Lưu lại các giá trị hiện tại
        this.lastQuality = parseInt(this.elements.qualitySlider.value);
        this.lastFormat = format;
        
        // Lưu bản đồ mới cho xử lý hàng loạt
        const newProcessedImages = new Map();
        
        for (let i = 0; i < this.selectedFiles.length; i++) {
            const file = this.selectedFiles[i];
            
            // Tìm imageId tương ứng với file
            let imageId = this.findImageIdByFile(file);
            
            if (!imageId) {
                // Nếu không tìm thấy imageId, tạo mới
                imageId = `img-${Date.now()}-${i}`;
            }
            
            if (showProgress) {
                this.updateProgress(i, this.selectedFiles.length);
            }
            
            try {
                const compressed = await this.compressImage(file, quality, format);
                
                if (compressed) {
                    newProcessedImages.set(imageId, {
                        original: file,
                        compressed: compressed,
                        imageId: imageId
                    });
                    
                    // Update comparison view if this is the active image
                    if (this.currentActiveImageId === imageId) {
                        this.elements.compressedImage.src = compressed.dataUrl;
                        this.elements.compressedSize.textContent = this.formatFileSize(compressed.size);
                        
                        // Đảm bảo tính toán chính xác % tiết kiệm
                        const saved = file.size - compressed.size;
                        const savedPercent = (saved / file.size * 100).toFixed(1);
                        
                        this.elements.savedPercent.textContent = savedPercent + '%';
                        
                        // Đặt màu sắc dựa trên giá trị tiết kiệm
                        if (saved < 0) {
                            this.elements.savedPercent.style.color = 'var(--accent-red)';
                        } else {
                            this.elements.savedPercent.style.color = 'var(--accent-green)';
                        }
                    }
                }
                
                // Cập nhật batch info sau mỗi vài ảnh để UI phản hồi tốt hơn
                if (i % 3 === 0 || i === this.selectedFiles.length - 1) {
                    this.processedImages = new Map([...newProcessedImages]);
                    this.scheduleBatchInfoUpdate();
                }
                
            } catch (error) {
                console.error('Lỗi khi nén ảnh:', error);
            }
        }
        
        // Cập nhật processedImages với bản đồ mới
        this.processedImages = newProcessedImages;
        
        if (showProgress) {
            this.updateProgress(this.selectedFiles.length, this.selectedFiles.length);
            this.hideProcessingProgress();
        }
        
        // Luôn cập nhật batch info sau khi hoàn thành
        this.updateBatchInfo();
        this.updateActionButtons();
        this.isProcessing = false;
    }

    async startBatchCompression(files = this.selectedFiles, startIndex = 0) {
        if (files.length === 0) return;
        if (this.isProcessing) {
            setTimeout(() => this.startBatchCompression(files, startIndex), 100);
            return;
        }

        this.isProcessing = true;
        const quality = parseInt(this.elements.qualitySlider.value) / 100;
        const format = this.elements.formatSelect.value;
        
        // Lưu lại các giá trị hiện tại
        this.lastQuality = parseInt(this.elements.qualitySlider.value);
        this.lastFormat = format;
        
        // Mảng các imageId được tạo ra trong quá trình xử lý
        const createdImageIds = [];
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const actualIndex = startIndex + i;
            const imageId = `img-${Date.now()}-${actualIndex}`;
            createdImageIds.push(imageId);
            
            try {
                const compressed = await this.compressImage(file, quality, format);
                
                if (compressed) {
                    this.processedImages.set(imageId, {
                        original: file,
                        compressed: compressed,
                        imageId: imageId
                    });
                    
                    // Update comparison view if this is the active image
                    if (this.currentActiveImageId === imageId) {
                        this.elements.compressedImage.src = compressed.dataUrl;
                        this.elements.compressedSize.textContent = this.formatFileSize(compressed.size);
                        
                        // Đảm bảo tính toán chính xác % tiết kiệm
                        const saved = file.size - compressed.size;
                        const savedPercent = (saved / file.size * 100).toFixed(1);
                        
                        this.elements.savedPercent.textContent = savedPercent + '%';
                        
                        // Đặt màu sắc dựa trên giá trị tiết kiệm
                        if (saved < 0) {
                            this.elements.savedPercent.style.color = 'var(--accent-red)';
                        } else {
                            this.elements.savedPercent.style.color = 'var(--accent-green)';
                        }
                    }
                    
                    // Auto-show first image if none selected
                    if (i === 0 && !this.currentActiveImageId) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            this.showImageComparison(imageId, file, e.target.result);
                        };
                        reader.readAsDataURL(file);
                    }
                }
                
                // Cập nhật batch info sau mỗi vài ảnh để UI phản hồi tốt hơn
                if (i % 2 === 0 || i === files.length - 1) {
                    this.scheduleBatchInfoUpdate();
                }
                
            } catch (error) {
                console.error('Lỗi khi nén ảnh:', error);
            }
        }
        
        this.updateBatchInfo();
        this.updateActionButtons();
        this.isProcessing = false;
    }

    compressImage(file, quality, format) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                try {
                    const canvas = this.elements.canvas;
                    const ctx = canvas.getContext('2d');
                    
                    // Keep original dimensions
                    canvas.width = img.width;
                    canvas.height = img.height;
                    
                    // High-quality rendering
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    
                    // Clear canvas before drawing
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    
                    // Xử lý đặc biệt cho PNG để bảo toàn chất lượng tối đa
                    if (format === 'png') {
                        // Với PNG, chỉ vẽ ảnh không thêm nền
                        ctx.drawImage(img, 0, 0);
                    } else {
                        // Thêm nền trắng cho các định dạng khác
                        ctx.fillStyle = 'white';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 0, 0);
                    }
                    
                    // Lấy options nén
                    const { mimeType, compressionQuality } = this.calculateCompressionOptions(format, quality);
                    
                    // Với PNG, không truyền tham số quality
                    if (format === 'png') {
                        canvas.toBlob((blob) => {
                            if (blob) {
                                const reader = new FileReader();
                                reader.onload = () => {
                                    resolve({
                                        dataUrl: reader.result,
                                        blob: blob,
                                        size: blob.size,
                                        width: img.width,
                                        height: img.height
                                    });
                                };
                                reader.onerror = () => {
                                    reject(new Error('Lỗi khi đọc blob'));
                                };
                                reader.readAsDataURL(blob);
                            } else {
                                reject(new Error('Không thể tạo blob'));
                            }
                        }, mimeType);
                    } else {
                        // Với các định dạng khác, truyền tham số quality
                        canvas.toBlob((blob) => {
                            if (blob) {
                                const reader = new FileReader();
                                reader.onload = () => {
                                    resolve({
                                        dataUrl: reader.result,
                                        blob: blob,
                                        size: blob.size,
                                        width: img.width,
                                        height: img.height
                                    });
                                };
                                reader.onerror = () => {
                                    reject(new Error('Lỗi khi đọc blob'));
                                };
                                reader.readAsDataURL(blob);
                            } else {
                                reject(new Error('Không thể tạo blob'));
                            }
                        }, mimeType, compressionQuality);
                    }
                    
                } catch (error) {
                    reject(error);
                }
            };
            
            img.onerror = () => {
                reject(new Error('Lỗi khi tải ảnh'));
            };
            
            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target.result;
            };
            reader.onerror = () => {
                reject(new Error('Lỗi khi đọc file'));
            };
            reader.readAsDataURL(file);
        });
    }

    showProcessingProgress() {
        this.elements.processingProgress.style.display = 'block';
    }

    hideProcessingProgress() {
        this.elements.processingProgress.style.display = 'none';
    }

    updateProgress(current, total) {
        const percent = (current / total) * 100;
        this.elements.progressFill.style.width = percent + '%';
        this.elements.progressText.textContent = `${current} / ${total}`;
    }

    updateBatchInfo() {
        if (!this.elements.batchInfo) return;
        
        this.elements.imageCount.textContent = this.selectedFiles.length;
        
        let totalOriginal = 0;
        let totalCompressed = 0;
        let processedCount = 0;
        
        // Đảm bảo chỉ tính các file đã được xử lý
        for (let i = 0; i < this.selectedFiles.length; i++) {
            const file = this.selectedFiles[i];
            totalOriginal += file.size;
            
            // Tìm processed image tương ứng
            let processed = null;
            for (const entry of this.processedImages.values()) {
                if (entry.original === file) {
                    processed = entry;
                    break;
                }
            }
            
            if (processed && processed.compressed) {
                totalCompressed += processed.compressed.size;
                processedCount++;
            } else {
                // Nếu chưa xử lý, tạm thời tính bằng kích thước gốc
                totalCompressed += file.size;
            }
        }
        
        this.elements.totalOriginalSize.textContent = this.formatFileSize(totalOriginal);
        this.elements.totalCompressedSize.textContent = this.formatFileSize(totalCompressed);
        
        const saved = totalOriginal - totalCompressed;
        
        // Kiểm tra để tránh chia cho 0 và làm tròn đến 1 chữ số thập phân
        const savedPercent = totalOriginal > 0 ? ((saved / totalOriginal) * 100).toFixed(1) : '0.0';
        
        // Hiển thị tiết kiệm với định dạng đúng
        if (saved >= 0) {
            this.elements.totalSaved.textContent = `${this.formatFileSize(saved)} (${savedPercent}%)`;
            this.elements.totalSaved.style.color = 'var(--accent-green)';
        } else {
            // Trường hợp kích thước tăng lên (âm)
            this.elements.totalSaved.textContent = `${this.formatFileSize(Math.abs(saved))} (-${Math.abs(savedPercent)}%)`;
            this.elements.totalSaved.style.color = 'var(--accent-red)';
        }
    }

    // Download functionality
    async downloadSelectedImages() {
        // Kiểm tra và log số lượng ảnh đã chọn trước khi tải xuống
        const selectedIds = Array.from(this.selectedImageIds);
        console.log(`Bắt đầu tải xuống ${selectedIds.length} ảnh đã chọn...`);
        
        if (selectedIds.length === 0) {
            this.showToast('Vui lòng chọn ít nhất một ảnh để tải xuống');
            return;
        }

        this.showToast('Đang tải xuống...', true);
        
        let downloadCount = 0;
        let downloadErrors = 0;
        
        // Debug: liệt kê tất cả ảnh đã chọn trước khi tải
        selectedIds.forEach((id, index) => {
            const processed = this.processedImages.get(id);
            if (processed) {
                console.log(`Ảnh ${index + 1}: ID=${id}, Tên=${processed.original.name}, Có blob=${!!processed.compressed?.blob}`);
            } else {
                console.log(`Ảnh ${index + 1}: ID=${id}, KHÔNG TÌM THẤY TRONG processedImages`);
            }
        });
        
        // Đảm bảo tất cả ảnh đã được xử lý trước khi tải xuống
        const unprocessedIds = selectedIds.filter(id => !this.processedImages.has(id));
        if (unprocessedIds.length > 0) {
            console.log(`Có ${unprocessedIds.length} ảnh chưa được xử lý, tiến hành xử lý...`);
            
            // Xử lý các ảnh chưa được nén
            for (const id of unprocessedIds) {
                const thumbnailEl = document.querySelector(`[data-image-id="${id}"]`);
                if (thumbnailEl) {
                    const index = Array.from(this.elements.thumbnailsGrid.children).indexOf(thumbnailEl);
                    if (index >= 0 && index < this.selectedFiles.length) {
                        const file = this.selectedFiles[index];
                        const quality = parseInt(this.elements.qualitySlider.value) / 100;
                        const format = this.elements.formatSelect.value;
                        
                        try {
                            console.log(`Đang xử lý ảnh ID=${id}...`);
                            const compressed = await this.compressImage(file, quality, format);
                            this.processedImages.set(id, {
                                original: file,
                                compressed: compressed,
                                imageId: id
                            });
                            console.log(`Xử lý thành công ảnh ID=${id}`);
                        } catch (error) {
                            console.error(`Lỗi khi xử lý ảnh ID=${id}:`, error);
                        }
                    }
                }
            }
        }
        
        // Kiểm tra lại sau khi xử lý
        console.log(`Bắt đầu tải xuống sau khi đã xử lý ${this.processedImages.size} ảnh...`);
        
        for (const imageId of selectedIds) {
            const processed = this.processedImages.get(imageId);
            
            if (processed && processed.compressed && processed.compressed.blob) {
                const originalName = processed.original.name;
                const format = this.elements.formatSelect.value;
                const newFileName = this.addWatermarkToFileName(originalName, format);
                
                try {
                    console.log(`Đang tải xuống ảnh ID=${imageId}, Tên=${newFileName}...`);
                    // Sử dụng method để download
                    await this.downloadFile(processed.compressed.blob, newFileName);
                    downloadCount++;
                    console.log(`Tải xuống thành công ảnh ${newFileName}`);
                    
                    // Small delay between downloads
                    await new Promise(resolve => setTimeout(resolve, 200));
                } catch (error) {
                    console.error(`Lỗi khi tải xuống ảnh ID=${imageId}:`, error);
                    downloadErrors++;
                }
            } else {
                console.error(`Không thể tải xuống ảnh ID=${imageId}: Không tìm thấy dữ liệu đã xử lý`);
                downloadErrors++;
            }
        }
        
        this.hideToast();
        console.log(`Hoàn thành: Tải xuống ${downloadCount}/${selectedIds.length} ảnh, Lỗi: ${downloadErrors}`);
        this.showSuccessModal(downloadCount);
    }

    // Method để download file
    downloadFile(blob, filename) {
        return new Promise((resolve, reject) => {
            try {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                link.style.display = 'none';
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // Cleanup URL object
                setTimeout(() => {
                    URL.revokeObjectURL(url);
                    resolve();
                }, 100);
            } catch (error) {
                reject(error);
            }
        });
    }

    addWatermarkToFileName(originalName, format) {
        const lastDotIndex = originalName.lastIndexOf('.');
        const nameWithoutExt = lastDotIndex > -1 ? 
            originalName.substring(0, lastDotIndex) : originalName;
        
        return `${nameWithoutExt} (W).${format}`;
    }

    clearAllImages() {
        this.selectedFiles = [];
        this.processedImages.clear();
        this.selectedImageIds.clear();
        this.currentActiveImageId = null;
        
        this.elements.thumbnailsGrid.innerHTML = '';
        this.elements.welcomeScreen.style.display = 'flex';
        this.elements.comparisonView.style.display = 'none';
        this.elements.thumbnailsSection.style.display = 'none';
        this.elements.settingsPanel.style.display = 'none';
        this.elements.batchInfo.style.display = 'none';
        this.elements.sidebarRight.style.display = 'none';
        
        this.updateActionButtons();
    }

    // UI helpers
    showToast(message, persistent = false) {
        this.elements.loadingToast.querySelector('span').textContent = message;
        this.elements.loadingToast.style.display = 'block';
        
        if (!persistent) {
            setTimeout(() => this.hideToast(), 3000);
        }
    }

    hideToast() {
        this.elements.loadingToast.style.display = 'none';
    }

    showSuccessModal(downloadCount) {
        let totalOriginal = 0;
        let totalCompressed = 0;
        
        // Chỉ tính các ảnh đã chọn
        for (const imageId of this.selectedImageIds) {
            const processed = this.processedImages.get(imageId);
            if (processed) {
                totalOriginal += processed.original.size;
                totalCompressed += processed.compressed.size;
            }
        }
        
        const savings = totalOriginal > 0 ? 
            ((totalOriginal - totalCompressed) / totalOriginal * 100).toFixed(1) : 0;
        
        this.elements.modalBody.innerHTML = `
            <div style="text-align: center; margin-bottom: 1.5rem;">
                <div style="width: 80px; height: 80px; background: var(--accent-green); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
                    <i class="fas fa-check" style="font-size: 2rem; color: white;"></i>
                </div>
                <h3 style="margin-bottom: 0.5rem;">Tải xuống thành công!</h3>
                <p style="color: var(--text-secondary);">Đã tải xuống ${downloadCount} hình ảnh đã nén</p>
            </div>
            
            <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 2rem; margin-bottom: 1.5rem;">
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; text-align: center;">
                    <div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--accent-blue); margin-bottom: 0.5rem;">${downloadCount}</div>
                        <div style="font-size: 0.875rem; color: var(--text-secondary);">Hình ảnh</div>
                    </div>
                    <div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--accent-green); margin-bottom: 0.5rem;">${savings}%</div>
                        <div style="font-size: 0.875rem; color: var(--text-secondary);">Tiết kiệm</div>
                    </div>
                    <div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--accent-purple); margin-bottom: 0.5rem;">${this.formatFileSize(totalOriginal - totalCompressed)}</div>
                        <div style="font-size: 0.875rem; color: var(--text-secondary);">Dung lượng</div>
                    </div>
                </div>
            </div>
            
            <div style="text-align: center;">
                <p style="color: var(--text-muted); font-size: 0.875rem;">
                    <i class="fas fa-info-circle"></i>
                    Tất cả file đã được thêm hậu tố (W) vào tên
                </p>
            </div>
        `;
        
        this.elements.modalOverlay.style.display = 'flex';
    }

    // Utility functions
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
        return parseFloat((Math.abs(bytes) / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
}

// Global functions
function closeModal() {
    document.getElementById('modalOverlay').style.display = 'none';
}

function closeUrlModal() {
    document.getElementById('urlModalOverlay').style.display = 'none';
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    window.SqueezoPro = new SqueezoProBatch();
    
    // Add welcome screen animations
    setTimeout(() => {
        const welcomeElements = document.querySelectorAll('.welcome-content > *');
        welcomeElements.forEach((el, index) => {
            setTimeout(() => {
                el.style.animation = 'slideUp 0.8s ease-out forwards';
                el.style.opacity = '0';
                el.style.transform = 'translateY(30px)';
                setTimeout(() => {
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                }, 50);
            }, index * 200);
        });
    }, 300);
    
    // Enhanced button interactions
    document.querySelectorAll('.btn, .control-btn').forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px) scale(1.02)';
        });
        
        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
        
        btn.addEventListener('click', function(e) {
            // Enhanced ripple effect
            const ripple = document.createElement('div');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: radial-gradient(circle, rgba(255,255,255,0.4), transparent);
                border-radius: 50%;
                left: ${x}px;
                top: ${y}px;
                pointer-events: none;
                transform: scale(0);
                animation: ripple 0.8s ease-out;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 800);
        });
    });
});

// Enhanced ripple animation
const rippleCSS = document.createElement('style');
rippleCSS.textContent = `
    @keyframes ripple {
        to {
            transform: scale(3);
            opacity: 0;
        }
    }
    
    /* Thêm CSS cho thông báo PNG */
    .png-format-notice {
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 5px 0;
    }
    .png-format-notice i {
        color: var(--accent-blue);
    }
    
    /* CSS cho tính năng upload URL */
    .url-upload-button {
        margin-top: 10px;
        width: 100%;
        text-align: center;
    }

    .url-btn {
        background: rgba(139, 92, 246, 0.2);
        color: var(--text-primary);
        border: 1px solid var(--glass-border);
        padding: 6px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.8rem;
        transition: all 0.3s ease;
        display: inline-flex;
        align-items: center;
        gap: 5px;
    }

    .url-btn:hover {
        background: rgba(139, 92, 246, 0.4);
        transform: translateY(-2px);
    }

    .url-modal {
        width: 500px;
        max-width: 90%;
    }

    .url-input-container {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .url-input-container label {
        color: var(--text-secondary);
        font-size: 0.9rem;
    }

    .url-input {
        width: 100%;
        padding: 10px 12px;
        border-radius: var(--border-radius);
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid var(--glass-border);
        color: var(--text-primary);
        font-size: 0.9rem;
        transition: all 0.3s ease;
    }

    .url-input:focus {
        outline: none;
        border-color: var(--accent-purple);
        box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
    }

    .url-preview {
        width: 100%;
        height: 200px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: var(--border-radius);
        border: 1px dashed var(--glass-border);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
    }

    .preview-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        color: var(--text-muted);
    }

    .preview-placeholder i {
        font-size: 2rem;
        opacity: 0.5;
    }

    .url-error {
        color: var(--accent-red);
        font-size: 0.85rem;
        padding: 8px;
        background: rgba(239, 68, 68, 0.1);
        border-radius: 6px;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .url-buttons {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        margin-top: 10px;
    }
`;
document.head.appendChild(rippleCSS);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (window.SqueezoPro) {
        switch(e.key) {
            case 'Enter':
                if (e.ctrlKey || e.metaKey) {
                    window.SqueezoPro.downloadSelectedImages();
                }
                break;
            case 'Escape':
                closeModal();
                closeUrlModal();
                break;
            case 'a':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    window.SqueezoPro.selectAllImages();
                }
                break;
            case 'Delete':
            case 'Backspace':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    window.SqueezoPro.clearAllImages();
                }
                break;
        }
    }
});
