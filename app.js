/* ==========================================================================
   GeoPhoto Edit - Core JavaScript Application Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- Constants & Default Location (CAC Milagro) ---
    const DEFAULT_LOCATION = {
        name: 'Centro de Atención Ciudadana del Cantón Milagro',
        address: 'Avenida 17 de Septiembre y Avenida Colón Esquina, BLOQUE A PLANTA BAJA, Milagro, Guayas, Ecuador',
        lat: -2.140300,
        lon: -79.596900
    };

    // --- Application State ---
    const state = {
        selectedLat: DEFAULT_LOCATION.lat,
        selectedLon: DEFAULT_LOCATION.lon,
        selectedAddress: DEFAULT_LOCATION.address,
        selectedTitle: DEFAULT_LOCATION.name,
        originalFile: null,
        originalFileName: '',
        convertedJpegDataUrl: null,
        originalExifDate: null,
        isJpeg: false
    };

    // --- DOM Elements ---
    const dropzone = document.getElementById('dropzone');
    const dropzoneEmpty = document.getElementById('dropzoneEmpty');
    const previewContainer = document.getElementById('previewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const fileInput = document.getElementById('fileInput');
    const btnSelectFile = document.getElementById('btnSelectFile');
    const btnCamera = document.getElementById('btnCamera');
    const btnRemoveImage = document.getElementById('btnRemoveImage');
    const btnChangeImage = document.getElementById('btnChangeImage');
    const formatBadge = document.getElementById('formatBadge');

    const inputDate = document.getElementById('inputDate');
    const inputTime = document.getElementById('inputTime');
    const btnSetNow = document.getElementById('btnSetNow');
    const btnRestoreDate = document.getElementById('btnRestoreDate');
    const inputFileName = document.getElementById('inputFileName');

    const inputSearchAddress = document.getElementById('inputSearchAddress');
    const btnSearch = document.getElementById('btnSearch');
    const searchResults = document.getElementById('searchResults');
    const btnResetDefaultLoc = document.getElementById('btnResetDefaultLoc');
    const btnCurrentGPS = document.getElementById('btnCurrentGPS');

    const locationTitle = document.getElementById('locationTitle');
    const locationAddress = document.getElementById('locationAddress');
    const lblLat = document.getElementById('lblLat');
    const lblLon = document.getElementById('lblLon');

    const summaryFormat = document.getElementById('summaryFormat');
    const summaryDateTime = document.getElementById('summaryDateTime');
    const btnSaveImage = document.getElementById('btnSaveImage');
    const btnShareImage = document.getElementById('btnShareImage');
    const btnPWAInstall = document.getElementById('btnPWAInstall');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    // --- Initialize Date & Time Inputs ---
    setCurrentDateTime();

    // --- Initialize Leaflet Map ---
    let map, marker;
    initMap();

    function initMap() {
        // Create Leaflet map centered at CAC Milagro
        map = L.map('map', {
            zoomControl: true,
            attributionControl: true
        }).setView([DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon], 16);

        // Add OpenStreetMap Tile Layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        // Custom Leaflet Marker Icon
        const customIcon = L.divIcon({
            className: 'custom-leaflet-marker',
            html: `<div style="
                background: linear-gradient(135deg, #6366f1, #38bdf8);
                width: 32px;
                height: 32px;
                border-radius: 50%;
                border: 3px solid #ffffff;
                box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 14px;
            "><i class="fa-solid fa-location-dot"></i></div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });

        // Add Draggable Marker
        marker = L.marker([DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon], {
            draggable: true,
            icon: customIcon
        }).addTo(map);

        // Popup for Marker
        marker.bindPopup(`<b>${DEFAULT_LOCATION.name}</b><br>${DEFAULT_LOCATION.address}`).openPopup();

        // Marker Drag End Event
        marker.on('dragend', (e) => {
            const coord = e.target.getLatLng();
            updateLocation(coord.lat, coord.lng, true);
        });

        // Map Click Event
        map.on('click', (e) => {
            updateLocation(e.latlng.lat, e.latlng.lng, true);
        });
    }

    // --- Location Update Logic ---
    function updateLocation(lat, lon, reverseGeocode = false, titleOverride = null, addressOverride = null) {
        state.selectedLat = parseFloat(lat.toFixed(6));
        state.selectedLon = parseFloat(lon.toFixed(6));

        marker.setLatLng([state.selectedLat, state.selectedLon]);
        map.panTo([state.selectedLat, state.selectedLon]);

        lblLat.textContent = state.selectedLat.toFixed(6);
        lblLon.textContent = state.selectedLon.toFixed(6);

        if (titleOverride && addressOverride) {
            state.selectedTitle = titleOverride;
            state.selectedAddress = addressOverride;
            locationTitle.textContent = state.selectedTitle;
            locationAddress.textContent = state.selectedAddress;
            marker.bindPopup(`<b>${state.selectedTitle}</b><br>${state.selectedAddress}`).openPopup();
        } else if (reverseGeocode) {
            locationTitle.textContent = 'Cargando dirección...';
            locationAddress.textContent = 'Obteniendo datos de OpenStreetMap Nominatim...';

            // OpenStreetMap Reverse Geocoding API
            fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${state.selectedLat}&lon=${state.selectedLon}`)
                .then(res => res.json())
                .then(data => {
                    const name = data.display_name ? data.display_name.split(',')[0] : 'Ubicación seleccionada';
                    state.selectedTitle = name;
                    state.selectedAddress = data.display_name || `Lat: ${state.selectedLat}, Lon: ${state.selectedLon}`;

                    locationTitle.textContent = state.selectedTitle;
                    locationAddress.textContent = state.selectedAddress;
                    marker.bindPopup(`<b>${state.selectedTitle}</b><br>${state.selectedAddress}`).openPopup();
                })
                .catch(() => {
                    state.selectedTitle = 'Ubicación seleccionada';
                    state.selectedAddress = `Lat: ${state.selectedLat}, Lon: ${state.selectedLon}`;
                    locationTitle.textContent = state.selectedTitle;
                    locationAddress.textContent = state.selectedAddress;
                });
        }
    }

    // --- Reset to CAC Milagro Default ---
    btnResetDefaultLoc.addEventListener('click', () => {
        updateLocation(
            DEFAULT_LOCATION.lat,
            DEFAULT_LOCATION.lon,
            false,
            DEFAULT_LOCATION.name,
            DEFAULT_LOCATION.address
        );
        map.setZoom(16);
        showToast('Restablecido a CAC Milagro');
    });

    // --- Device GPS Location ---
    btnCurrentGPS.addEventListener('click', () => {
        if (!navigator.geolocation) {
            showToast('Navegador no soporta Geolocalización', true);
            return;
        }

        showToast('Obteniendo ubicación GPS actual...');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                updateLocation(pos.coords.latitude, pos.coords.longitude, true);
                showToast('Ubicación GPS actualizada');
            },
            (err) => {
                showToast('Error al obtener GPS: ' + err.message, true);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    });

    // --- OpenStreetMap Nominatim Address Search ---
    let searchTimeout;
    inputSearchAddress.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        const query = inputSearchAddress.value.trim();
        if (query.length < 3) {
            searchResults.classList.add('hidden');
            return;
        }

        searchTimeout = setTimeout(() => {
            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`)
                .then(res => res.json())
                .then(data => {
                    searchResults.innerHTML = '';
                    if (data.length === 0) {
                        searchResults.innerHTML = '<div class="search-item">No se encontraron resultados</div>';
                    } else {
                        data.forEach(item => {
                            const div = document.createElement('div');
                            div.className = 'search-item';
                            div.textContent = item.display_name;
                            div.addEventListener('click', () => {
                                updateLocation(
                                    parseFloat(item.lat),
                                    parseFloat(item.lon),
                                    false,
                                    item.display_name.split(',')[0],
                                    item.display_name
                                );
                                searchResults.classList.add('hidden');
                                inputSearchAddress.value = '';
                            });
                            searchResults.appendChild(div);
                        });
                    }
                    searchResults.classList.remove('hidden');
                })
                .catch(() => {
                    searchResults.classList.add('hidden');
                });
        }, 400);
    });

    btnSearch.addEventListener('click', () => {
        const query = inputSearchAddress.value.trim();
        if (query) {
            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)
                .then(res => res.json())
                .then(data => {
                    if (data.length > 0) {
                        const item = data[0];
                        updateLocation(
                            parseFloat(item.lat),
                            parseFloat(item.lon),
                            false,
                            item.display_name.split(',')[0],
                            item.display_name
                        );
                        searchResults.classList.add('hidden');
                        inputSearchAddress.value = '';
                    } else {
                        showToast('No se encontró el lugar buscado', true);
                    }
                });
        }
    });

    // Close search results on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-box')) {
            searchResults.classList.add('hidden');
        }
    });

    // --- Date & Time Form Logic ---
    function setCurrentDateTime() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        inputDate.value = `${year}-${month}-${day}`;
        inputTime.value = `${hours}:${minutes}:${seconds}`;
        updateSummary();
    }

    btnSetNow.addEventListener('click', () => {
        setCurrentDateTime();
        showToast('Fecha y Hora actualizadas a "Ahora"');
    });

    btnRestoreDate.addEventListener('click', () => {
        if (state.originalExifDate) {
            const d = state.originalExifDate;
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            const seconds = String(d.getSeconds()).padStart(2, '0');

            inputDate.value = `${year}-${month}-${day}`;
            inputTime.value = `${hours}:${minutes}:${seconds}`;
            updateSummary();
            showToast('Restablecido a fecha original de la foto');
        }
    });

    inputDate.addEventListener('change', updateSummary);
    inputTime.addEventListener('change', updateSummary);

    function updateSummary() {
        if (inputDate.value && inputTime.value) {
            summaryDateTime.textContent = `${inputDate.value} ${inputTime.value}`;
        }
    }

    // --- Image Handling & Processing ---
    btnSelectFile.addEventListener('click', () => {
        fileInput.removeAttribute('capture');
        fileInput.click();
    });

    btnCamera.addEventListener('click', () => {
        fileInput.setAttribute('capture', 'environment');
        fileInput.click();
    });

    btnChangeImage.addEventListener('click', () => {
        fileInput.removeAttribute('capture');
        fileInput.click();
    });

    btnRemoveImage.addEventListener('click', resetImage);

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            processSelectedFile(e.target.files[0]);
        }
    });

    // Drag and Drop
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
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processSelectedFile(e.dataTransfer.files[0]);
        }
    });

    function processSelectedFile(file) {
        state.originalFile = file;
        let nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        
        // If filename is a hex hash or UUID, use clean default
        if (/^[0-9a-fA-F-]{16,}$/.test(nameWithoutExt)) {
            nameWithoutExt = 'Foto';
        }
        
        state.originalFileName = nameWithoutExt;
        inputFileName.value = nameWithoutExt + '_CAC_Milagro';

        state.isJpeg = file.type === 'image/jpeg' || file.type === 'image/jpg';

        const reader = new FileReader();
        reader.onload = (evt) => {
            const dataUrl = evt.target.result;

            // Try reading original EXIF date if JPEG
            if (state.isJpeg && typeof piexif !== 'undefined') {
                try {
                    const exifObj = piexif.load(dataUrl);
                    const originalDateStr = exifObj['Exif'][piexif.ExifIFD.DateTimeOriginal] || exifObj['0th'][piexif.ImageIFD.DateTime];
                    if (originalDateStr) {
                        // EXIF format "YYYY:MM:DD HH:MM:SS"
                        const parts = originalDateStr.split(' ');
                        const dateParts = parts[0].split(':');
                        const timeParts = parts[1].split(':');
                        state.originalExifDate = new Date(
                            parseInt(dateParts[0]),
                            parseInt(dateParts[1]) - 1,
                            parseInt(dateParts[2]),
                            parseInt(timeParts[0]),
                            parseInt(timeParts[1]),
                            parseInt(timeParts[2])
                        );
                        btnRestoreDate.disabled = false;
                    }
                } catch (err) {
                    console.log('No EXIF metadata in source JPEG');
                }
            }

            // Convert to clean JPEG via HTML5 Canvas
            convertImageToJpeg(dataUrl, (jpegDataUrl) => {
                state.convertedJpegDataUrl = jpegDataUrl;

                // Update UI preview
                imagePreview.src = jpegDataUrl;
                dropzoneEmpty.classList.add('hidden');
                previewContainer.classList.remove('hidden');

                formatBadge.textContent = 'JPEG 100%';
                formatBadge.className = 'badge badge-success';
                summaryFormat.textContent = 'JPEG Listo';

                btnSaveImage.disabled = false;
                if (navigator.share) {
                    btnShareImage.classList.remove('hidden');
                    btnShareImage.disabled = false;
                }

                showToast('Fotografía cargada y convertida a JPEG');
            });
        };
        reader.readAsDataURL(file);
    }

    function convertImageToJpeg(srcDataUrl, callback) {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            
            // Draw background white in case of PNG transparency
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);

            // Export as JPEG with quality 0.98
            const jpegUrl = canvas.toDataURL('image/jpeg', 0.98);
            callback(jpegUrl);
        };
        img.src = srcDataUrl;
    }

    function resetImage() {
        state.originalFile = null;
        state.convertedJpegDataUrl = null;
        state.originalExifDate = null;
        fileInput.value = '';

        dropzoneEmpty.classList.remove('hidden');
        previewContainer.classList.add('hidden');
        imagePreview.src = '';

        formatBadge.textContent = 'Sin cargar';
        formatBadge.className = 'badge';
        summaryFormat.textContent = 'Sin archivo';

        btnSaveImage.disabled = true;
        btnShareImage.disabled = true;
        btnRestoreDate.disabled = true;
    }

    // --- EXIF Encoding Engine (Lat, Lon, Date, Time) ---
    function generateModifiedJpegWithExif() {
        if (!state.convertedJpegDataUrl) return null;

        // Parse date and time values from inputs
        const dateVal = inputDate.value; // YYYY-MM-DD
        const timeVal = inputTime.value; // HH:MM:SS or HH:MM
        
        let timeParts = timeVal.split(':');
        let hours = String(timeParts[0] || '00').padStart(2, '0');
        let minutes = String(timeParts[1] || '00').padStart(2, '0');
        let seconds = String(timeParts[2] || '00').padStart(2, '0');

        let dateParts = dateVal.split('-');
        let year = dateParts[0];
        let month = String(dateParts[1]).padStart(2, '0');
        let day = String(dateParts[2]).padStart(2, '0');

        const exifDateStr = `${year}:${month}:${day} ${hours}:${minutes}:${seconds}`;
        const gpsDateStr = `${year}:${month}:${day}`;

        // Convert Latitude & Longitude to EXIF Rationals (DMS)
        const latRef = state.selectedLat < 0 ? 'S' : 'N';
        const absLat = Math.abs(state.selectedLat);
        const latDeg = Math.floor(absLat);
        const latMin = Math.floor((absLat - latDeg) * 60);
        const latSec = Math.round(((absLat - latDeg) * 60 - latMin) * 60 * 100);

        const lonRef = state.selectedLon < 0 ? 'W' : 'E';
        const absLon = Math.abs(state.selectedLon);
        const lonDeg = Math.floor(absLon);
        const lonMin = Math.floor((absLon - lonDeg) * 60);
        const lonSec = Math.round(((absLon - lonDeg) * 60 - lonMin) * 60 * 100);

        // Get image preview dimensions if available
        const imgW = imagePreview.naturalWidth || 1920;
        const imgH = imagePreview.naturalHeight || 1080;

        // 0th IFD (Standard Camera Attributes)
        const zerothIfd = {};
        zerothIfd[piexif.ImageIFD.Make] = "SAMSUNG";
        zerothIfd[piexif.ImageIFD.Model] = "SM-G998B";
        zerothIfd[piexif.ImageIFD.Orientation] = 1;
        zerothIfd[piexif.ImageIFD.XResolution] = [72, 1];
        zerothIfd[piexif.ImageIFD.YResolution] = [72, 1];
        zerothIfd[piexif.ImageIFD.ResolutionUnit] = 2;
        zerothIfd[piexif.ImageIFD.Software] = "G998BXXU5EWA6";
        zerothIfd[piexif.ImageIFD.DateTime] = exifDateStr;

        // Exif IFD (Standard Camera EXIF Header)
        const exifIfd = {};
        exifIfd[piexif.ExifIFD.ExifVersion] = "0230";
        exifIfd[piexif.ExifIFD.DateTimeOriginal] = exifDateStr;
        exifIfd[piexif.ExifIFD.DateTimeDigitized] = exifDateStr;
        exifIfd[piexif.ExifIFD.ColorSpace] = 1;
        exifIfd[piexif.ExifIFD.PixelXDimension] = imgW;
        exifIfd[piexif.ExifIFD.PixelYDimension] = imgH;

        // GPS IFD (Standard GPS Attributes matching WGS-84)
        const gpsIfd = {};
        gpsIfd[piexif.GPSIFD.GPSVersionID] = [2, 2, 0, 0];
        gpsIfd[piexif.GPSIFD.GPSLatitudeRef] = latRef;
        gpsIfd[piexif.GPSIFD.GPSLatitude] = [
            [latDeg, 1],
            [latMin, 1],
            [latSec, 100]
        ];
        gpsIfd[piexif.GPSIFD.GPSLongitudeRef] = lonRef;
        gpsIfd[piexif.GPSIFD.GPSLongitude] = [
            [lonDeg, 1],
            [lonMin, 1],
            [lonSec, 100]
        ];
        gpsIfd[piexif.GPSIFD.GPSAltitudeRef] = 0;
        gpsIfd[piexif.GPSIFD.GPSAltitude] = [15, 1];
        gpsIfd[piexif.GPSIFD.GPSTimeStamp] = [
            [parseInt(hours), 1],
            [parseInt(minutes), 1],
            [parseInt(seconds), 1]
        ];
        gpsIfd[piexif.GPSIFD.GPSMapDatum] = "WGS-84";
        gpsIfd[piexif.GPSIFD.GPSDateStamp] = gpsDateStr;
        gpsIfd[piexif.GPSIFD.GPSProcessingMethod] = "CELLID";

        const exifObj = {
            "0th": zerothIfd,
            "Exif": exifIfd,
            "GPS": gpsIfd
        };

        const exifBytes = piexif.dump(exifObj);
        const finalJpegDataUrl = piexif.insert(exifBytes, state.convertedJpegDataUrl);
        return finalJpegDataUrl;
    }

    // --- Save & Download Trigger ---
    btnSaveImage.addEventListener('click', () => {
        saveFinalImage(false);
    });

    btnShareImage.addEventListener('click', () => {
        saveFinalImage(true);
    });

    function dataURItoBlob(dataURI) {
        const byteString = atob(dataURI.split(',')[1]);
        const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], { type: mimeString });
    }

    function saveFinalImage(isShare = false) {
        showToast('Procesando metadatos EXIF...');

        setTimeout(() => {
            try {
                const finalJpegDataUrl = generateModifiedJpegWithExif();
                if (!finalJpegDataUrl) {
                    showToast('Error al generar la imagen', true);
                    return;
                }

                // Sanitize output filename and force .jpg extension
                let rawName = inputFileName.value.trim() || 'GeoPhoto_Foto';
                rawName = rawName.replace(/\.(jpg|jpeg|png|webp|heic|gif)$/i, '');
                rawName = rawName.replace(/[/\\?%*:|"<>]/g, '_');
                const finalFileName = `${rawName}.jpg`;

                if (isShare && navigator.share) {
                    // Share via Web Share API (Android)
                    const blob = dataURItoBlob(finalJpegDataUrl);
                    const file = new File([blob], finalFileName, { type: 'image/jpeg' });
                    navigator.share({
                        files: [file],
                        title: 'Foto con EXIF modificado',
                        text: `Ubicación: ${state.selectedTitle}`
                    }).then(() => {
                        showToast('Compartido con éxito');
                    }).catch(() => {
                        triggerDownload(finalJpegDataUrl, finalFileName);
                    });
                } else {
                    // Direct file download on Desktop / Android
                    triggerDownload(finalJpegDataUrl, finalFileName);
                }
            } catch (err) {
                console.error(err);
                showToast('Error al guardar la imagen: ' + err.message, true);
            }
        }, 150);
    }

    function triggerDownload(dataUrl, fileName) {
        let cleanName = fileName.trim();
        cleanName = cleanName.replace(/\.(jpg|jpeg|png|webp|heic|gif)$/i, '');
        cleanName = `${cleanName}.jpg`;

        const blob = dataURItoBlob(dataUrl);
        const blobUrl = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = blobUrl;
        a.download = cleanName;
        a.setAttribute('download', cleanName);

        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
            if (a.parentNode) {
                a.parentNode.removeChild(a);
            }
            URL.revokeObjectURL(blobUrl);
        }, 1000);

        showToast(`¡Imagen guardada como ${cleanName}!`);
    }




    // --- Toast Notifications ---
    function showToast(message, isError = false) {
        toastMessage.textContent = message;
        if (isError) {
            toast.classList.add('error');
        } else {
            toast.classList.remove('error');
        }
        toast.classList.remove('hidden');

        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3500);
    }

    // --- PWA Installation Support ---
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        btnPWAInstall.classList.remove('hidden');
    });

    btnPWAInstall.addEventListener('click', () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    btnPWAInstall.classList.add('hidden');
                }
                deferredPrompt = null;
            });
        }
    });

    // --- Service Worker Registration ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').catch(err => {
                console.log('SW Registration error: ', err);
            });
        });
    }
});


