let feedSources = [];
        let currentlyDisplayedFeedUrl = null;
        let currentlySelectedTag = null;
        let readItems = {};
        let currentItemInModal = null;
        let toastTimeout = null;

        const config = {
            CACHE_KEY_PREFIX: 'feed_cache_v5_',
            CACHE_DURATION_MS: 72 * 60 * 60 * 1000,
            FEED_SOURCES_STORAGE_KEY: 'rss_feed_reader_sources_v5',
            READ_ITEMS_STORAGE_KEY: 'rss_feed_reader_read_items_v2',
            READ_ITEM_EXPIRY_MS: 72 * 60 * 60 * 1000,
            DEFAULT_FEED_SOURCES: [
                { url: 'https://fedoramagazine.org/feed/', name: 'Fedora Magazine', isNsfw: false, tags: ['linux', 'tecnologia'] },
                { url: 'http://www.linuxinsider.com/perl/syndication/rssfull.pl', name: 'Linux Insider', isNsfw: false, tags: ['linux', 'notícias'] },
                { url: 'https://blog.youtube/rss/', name: 'YouTube Blog', isNsfw: false, tags: ['google', 'video'] },
                { url: 'https://feeds.feedburner.com/HaveIBeenPwnedLatestBreaches', name: 'Have I Been Pwned', isNsfw: false, tags: ['segurança', 'dados'] },
                { url: 'https://itsfoss.com/feed/', name: 'It\'s FOSS', isNsfw: false, tags: ['linux', 'open source'] },
                { url: 'https://www.minhaoperadora.com.br/feed', name: 'Minha Operadora', isNsfw: false, tags: ['telecom', 'brasil'] },
                { url: 'https://www.intercept.com.br/feed/', name: 'The Intercept Brasil', isNsfw: false, tags: ['jornalismo', 'investigativo', 'brasil'] },
                { url: 'https://torrentfreak.com/feed/', name: 'TorrentFreak', isNsfw: false, tags: ['tecnologia', 'privacidade', 'copyright'] },
                { url: 'https://www.omgubuntu.co.uk/feed/', name: 'OMG! Ubuntu!', isNsfw: false, tags: ['linux', 'ubuntu'] },
                { url: 'https://www.omglinux.com/feed/', name: 'OMG! Linux!', isNsfw: false, tags: ['linux', 'notícias'] },
                { url: 'https://blogdoiphone.com/feed/', name: 'Blog do iPhone', isNsfw: false, tags: ['apple', 'tecnologia', 'mobile'] },
                { url: 'https://news.opensuse.org/feed.xml', name: 'openSUSE News', isNsfw: false, tags: ['linux', 'open source', 'opensuse'] },
                { url: 'https://annas-archive.li/blog/rss.xml', name: 'Anna\'s Archive Blog', isNsfw: false, tags: ['livros', 'arquivos'] },
                { url: 'https://deolhonosruralistas.com.br/feed/', name: 'De Olho Nos Ruralistas', isNsfw: false, tags: ['brasil', 'agronegócio', 'jornalismo'] },
                { url: 'https://historiablog.org/feed/', name: 'História Blog', isNsfw: false, tags: ['história', 'educação'] },
                { url: 'https://www.metropoles.com/tag/goias/feed', name: 'Metrópoles - Goiás', isNsfw: false, tags: ['notícias', 'goiás', 'brasil'] },
                { url: 'http://www.jw.org/pt/noticias/rss/FullNewsRSS/feed.xml', name: 'JW.ORG Notícias', isNsfw: false, tags: ['religião'] },
                { url: 'https://vivaldi.com/feed/', name: 'Vivaldi Browser', isNsfw: false, tags: ['navegador', 'tecnologia', 'privacidade'] }
            ],
            CARD_COLORS: ['#f0f9ff', '#f0fdf4', '#f5f3ff', '#fff7ed', '#fefce8', '#fff1f2'],
            API_CACHE_FRESHNESS_MS: 20 * 60 * 1000
        };

        const domElements = {
            feedsContainer: document.getElementById('feeds-container'),
            loadingIndicator: document.getElementById('loading'),
            errorMessagesContainer: document.getElementById('error-messages'),
            feedItemModal: document.getElementById('feedItemModal'),
            modalTitle: document.getElementById('modalTitle'),
            modalContent: document.getElementById('modalContent'),
            modalOriginalLink: document.getElementById('modalOriginalLink'),
            closeModalButton: document.getElementById('closeModalButton'),
            modalMarkAsReadButton: document.getElementById('modalMarkAsReadButton'),
            sidebar: document.getElementById('sidebar'),
            sidebarToggle: document.getElementById('sidebarToggle'),
            sidebarToggleIconOpen: document.getElementById('sidebarToggleIconOpen'),
            sidebarToggleIconClose: document.getElementById('sidebarToggleIconClose'),
            mainContent: document.getElementById('main-content'),
            toggleAddFeedFormButton: document.getElementById('toggleAddFeedFormButton'),
            addFeedForm: document.getElementById('addFeedForm'),
            sidebarNewFeedUrlInput: document.getElementById('sidebarNewFeedUrlInput'),
            sidebarNewFeedNameInput: document.getElementById('sidebarNewFeedNameInput'),
            sidebarNewFeedTagsInput: document.getElementById('sidebarNewFeedTagsInput'),
            sidebarNewFeedNsfwInput: document.getElementById('sidebarNewFeedNsfw'),
            sidebarAddFeedButton: document.getElementById('sidebarAddFeedButton'),
            sidebarFeedListContainer: document.getElementById('sidebarFeedListContainer'),
            sidebarTagListContainer: document.getElementById('sidebarTagListContainer'),
            activeFilterTitleContainer: document.getElementById('activeFilterTitleContainer'),
            activeFilterTitle: document.getElementById('activeFilterTitle'),
            editSourceModal: document.getElementById('editSourceModal'),
            editSourceNameInput: document.getElementById('editSourceNameInput'),
            editSourceTagsInput: document.getElementById('editSourceTagsInput'),
            editSourceNsfwCheckbox: document.getElementById('editSourceNsfwCheckbox'),
            editSourceUrlHidden: document.getElementById('editSourceUrlHidden'),
            closeEditSourceModalButton: document.getElementById('closeEditSourceModalButton'),
            cancelEditSourceButton: document.getElementById('cancelEditSourceButton'),
            saveEditSourceButton: document.getElementById('saveEditSourceButton'),
            toastNotification: document.getElementById('toast-notification'),
            toastMessage: document.getElementById('toast-message')
        };

        /**
         * @namespace uiModule
         * @description Manages all UI-related interactions and updates.
         */
        const uiModule = {
            /**
             * Displays a toast notification message.
             * @param {string} message - The message to display.
             * @param {'info'|'error'|'success'} [type='info'] - The type of toast message.
             * @param {number} [duration=3500] - How long the toast should be visible in milliseconds.
             */
            showToast(message, type = 'info', duration = 3500) {
                if (toastTimeout) clearTimeout(toastTimeout);
                domElements.toastMessage.textContent = message;
                domElements.toastNotification.classList.remove('hidden', 'opacity-0', 'toast-error', 'toast-success');
                domElements.toastNotification.classList.add('opacity-100');

                if (type === 'error') domElements.toastNotification.classList.add('toast-error');
                else if (type === 'success') domElements.toastNotification.classList.add('toast-success');
                
                toastTimeout = setTimeout(() => {
                    domElements.toastNotification.classList.remove('opacity-100');
                    domElements.toastNotification.classList.add('opacity-0');
                    setTimeout(() => domElements.toastNotification.classList.add('hidden'), 300); // Wait for transition
                }, duration);
            },

            updateSidebarActiveState() {
                domElements.sidebarFeedListContainer.querySelectorAll('.sidebar-item-name').forEach(item => {
                    item.classList.toggle('active-feed', item.dataset.feedUrl === currentlyDisplayedFeedUrl);
                });
                domElements.sidebarTagListContainer.querySelectorAll('.tag-name').forEach(item => {
                    item.classList.toggle('active-tag', item.textContent === currentlySelectedTag);
                });
            },

            renderSidebarFeedList() {
                domElements.sidebarFeedListContainer.innerHTML = '';
                if (feedSources.length === 0) {
                    domElements.sidebarFeedListContainer.innerHTML = '<p class="text-gray-400 text-sm text-center p-2">Nenhuma fonte.</p>';
                    return;
                }
                feedSources.sort((a,b) => a.name.localeCompare(b.name)).forEach(source => {
                    const listItem = document.createElement('div');
                    listItem.className = 'sidebar-item group';
                    const nameAndTagsContainer = document.createElement('div');
                    nameAndTagsContainer.className = 'sidebar-item-name-container';
                    const nameSpan = document.createElement('span');
                    nameSpan.textContent = source.name;
                    nameSpan.title = source.url; 
                    nameSpan.dataset.feedUrl = source.url; 
                    nameSpan.className = 'sidebar-item-name';
                    nameSpan.onclick = () => handleSidebarFeedClick(source.url); // External call
                    nameAndTagsContainer.appendChild(nameSpan);

                    if (source.tags && source.tags.length > 0) {
                        const tagsDisplay = document.createElement('div');
                        tagsDisplay.className = 'feed-tags-display';
                        tagsDisplay.textContent = source.tags.join(', ');
                        nameAndTagsContainer.appendChild(tagsDisplay);
                    }
                    
                    if (source.isNsfw) {
                        const nsfwTag = document.createElement('span');
                        nsfwTag.textContent = 'NSFW';
                        nsfwTag.className = 'nsfw-tag ml-auto self-center'; 
                        nameAndTagsContainer.appendChild(nsfwTag); 
                    }
                    listItem.appendChild(nameAndTagsContainer);

                    const actionsDiv = document.createElement('div');
                    actionsDiv.className = 'sidebar-item-actions flex-shrink-0 flex gap-1';
                    const configButton = document.createElement('button');
                    configButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>`;
                    configButton.title = "Configurar Fonte";
                    configButton.className = "text-gray-400 hover:text-gray-300";
                    configButton.onclick = (e) => { e.stopPropagation(); this.openEditSourceModal(source); };
                    actionsDiv.appendChild(configButton);
                    
                    listItem.appendChild(actionsDiv);
                    domElements.sidebarFeedListContainer.appendChild(listItem);
                });
                this.updateSidebarActiveState(); 
            },

            /**
             * Renders the list of tags in the sidebar for filtering.
             * Reads from the global `feedSources` and `currentlySelectedTag`.
             * Calls `handleTagClick` (global) on tag click.
             */
            renderTagFilterList() {
                domElements.sidebarTagListContainer.innerHTML = '';
                const allTags = new Set();
                feedSources.forEach(source => {
                    if (source.tags) source.tags.forEach(tag => allTags.add(tag.trim().toLowerCase()));
                });

                if (allTags.size === 0) {
                    domElements.sidebarTagListContainer.innerHTML = '<p class="text-gray-400 text-sm text-center p-2">Nenhuma tag.</p>';
                    return;
                }
                
                const sortedTags = Array.from(allTags).sort((a,b) => a.localeCompare(b));
                if (currentlySelectedTag) {
                    const showAllItem = document.createElement('div');
                    showAllItem.className = 'tag-item group';
                    const showAllName = document.createElement('span');
                    showAllName.textContent = "Mostrar Todas as Tags";
                    showAllName.className = 'tag-name italic text-sky-400';
                    showAllName.onclick = () => handleTagClick(null); // External call
                    showAllItem.appendChild(showAllName);
                    domElements.sidebarTagListContainer.appendChild(showAllItem);
                }

                sortedTags.forEach(tag => {
                    const tagItem = document.createElement('div');
                    tagItem.className = 'tag-item group';
                    const tagNameSpan = document.createElement('span');
                    tagNameSpan.textContent = tag;
                    tagNameSpan.className = 'tag-name';
                    tagNameSpan.onclick = () => handleTagClick(tag); // External call
                    tagItem.appendChild(tagNameSpan);
                    domElements.sidebarTagListContainer.appendChild(tagItem);
                });
                this.updateSidebarActiveState();
            },

            /**
             * Opens the modal to edit a feed source's details.
             * @param {Object} source - The feed source object to edit.
             * @param {string} source.name - The current name of the feed source.
             * @param {Array<string>} [source.tags] - The current tags of the feed source.
             * @param {boolean} source.isNsfw - The current NSFW status of the feed source.
             * @param {string} source.url - The URL of the feed source (used as an identifier).
             */
            openEditSourceModal(source) {
                domElements.editSourceNameInput.value = source.name;
                domElements.editSourceTagsInput.value = source.tags ? source.tags.join(', ') : '';
                domElements.editSourceNsfwCheckbox.checked = source.isNsfw;
                domElements.editSourceUrlHidden.value = source.url;
                domElements.editSourceModal.classList.remove('hidden');
            },

            closeEditSourceModal() {
                domElements.editSourceModal.classList.add('hidden');
            },

            /**
             * Creates a DOM element for a single feed item card.
             * @param {Object} item - The feed item data.
             * @param {string} item.title - The title of the feed item.
             * @param {string} [item.thumbnail] - URL of the item's thumbnail image.
             * @param {Object} [item.enclosure] - Enclosure object, possibly containing an image link.
             * @param {string} [item.feedImage] - Fallback image from the feed itself.
             * @param {string} [item.description] - Item description, used if no other image source.
             * @param {boolean} [item.isNsfwSource=false] - Indicates if the source is NSFW, for image blurring.
             * @param {number} cardIndex - The index of the card, used for assigning background color.
             * @returns {HTMLElement} The created card element.
             */
            createCard(item, cardIndex) {
                const cardDiv = document.createElement('div');
                cardDiv.className = 'feed-card cursor-pointer rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col p-4 relative';
                
                cardDiv.style.backgroundColor = config.CARD_COLORS[cardIndex % config.CARD_COLORS.length];
                if (storageModule.isItemRead(item)) cardDiv.classList.add('is-read');
                cardDiv.addEventListener('click', () => this.openModal(item));

                let imageUrl = null;
                const commonTinyPixelDataUri1 = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
                const commonTinyPixelDataUri2 = "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="; // Common variant
                const minImageWidth = 50; // Minimum width for an image to be considered non-decorative

                // 1. Check item.thumbnail
                if (item.thumbnail && typeof item.thumbnail === 'string' && item.thumbnail.trim() !== '') {
                    imageUrl = item.thumbnail;
                }

                // 2. Check item.enclosure
                if (!imageUrl && item.enclosure && typeof item.enclosure.link === 'string' && item.enclosure.link.trim() !== '' && typeof item.enclosure.type === 'string' && item.enclosure.type.startsWith('image/')) {
                    imageUrl = item.enclosure.link;
                }

                // 3. Parse HTML from item.content or item.description
                if (!imageUrl) {
                    const htmlContentToParse = (item.content && typeof item.content === 'string' && item.content.trim() !== '') ? item.content : 
                                             (item.description && typeof item.description === 'string' && item.description.trim() !== '') ? item.description : null;
                    
                    if (htmlContentToParse) {
                        try {
                            const sanitizedHtml = DOMPurify.sanitize(htmlContentToParse, { USE_PROFILES: { html: true } });
                            const tempDiv = document.createElement('div');
                            tempDiv.innerHTML = sanitizedHtml;
                            const imgTags = tempDiv.querySelectorAll('img');
                            let potentialImages = [];

                            for (const imgTag of imgTags) {
                                const imgSrc = imgTag.getAttribute('src');
                                if (imgSrc && imgSrc.trim() !== '' && imgSrc !== commonTinyPixelDataUri1 && imgSrc !== commonTinyPixelDataUri2) {
                                    const widthAttr = imgTag.getAttribute('width');
                                    const imgWidth = widthAttr ? parseInt(widthAttr, 10) : 0;
                                    potentialImages.push({ src: imgSrc, width: imgWidth });
                                }
                            }
                            
                            // Select the first image that is reasonably sized, or the first one if none are large enough
                            if (potentialImages.length > 0) {
                                const largeEnoughImage = potentialImages.find(img => img.width >= minImageWidth);
                                imageUrl = largeEnoughImage ? largeEnoughImage.src : potentialImages[0].src; // Fallback to first if no large one
                            }

                        } catch (e) {
                            console.warn("Error parsing HTML content for image:", e);
                        }
                    }
                }

                // 4. Fallback to item.feedImage (derived from feed.image)
                if (!imageUrl && item.feedImage && typeof item.feedImage === 'string' && item.feedImage.trim() !== '') {
                    imageUrl = item.feedImage;
                }
                
                const titleElement = document.createElement('h2');
                titleElement.className = 'text-xl font-bold text-gray-800 leading-tight w-full'; 
                titleElement.textContent = item.title || 'Título indisponível';

                if (imageUrl) {
                    cardDiv.classList.add('items-center', 'space-y-3');
                    const imgElement = document.createElement('img');
                    imgElement.alt = item.title || 'Imagem do item';
                    imgElement.className = 'w-full h-48 object-cover rounded-md'; 
                    const unavailableImageUrl = `https://placehold.co/600x300/fecaca/991b1b?text=Imagem+Indispon%C3%ADvel`;

                    imgElement.onerror = function() { 
                        this.onerror = null; 
                        this.src = unavailableImageUrl; 
                        this.alt = 'Imagem indisponível';
                        this.classList.remove('filter', 'blur-sm', 'cursor-pointer'); 
                    };

                    if (item.isNsfwSource) { 
                        imgElement.classList.add('filter', 'blur-sm', 'cursor-pointer', 'transition-all', 'duration-300');
                        imgElement.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"; 
                        imgElement.dataset.realSrc = imageUrl;
                        imgElement.addEventListener('click', function revealNsfwImage(event) {
                            event.stopPropagation(); 
                            this.src = this.dataset.realSrc;
                            this.classList.remove('filter', 'blur-sm', 'cursor-pointer');
                        }, { once: true });
                    } else {
                        imgElement.src = imageUrl;
                    }
                    cardDiv.appendChild(imgElement);
                    titleElement.classList.add('text-center'); 
                } else {
                    titleElement.classList.add('text-justify');
                    cardDiv.classList.add('justify-center'); 
                    cardDiv.style.minHeight = '120px'; 
                    titleElement.style.marginTop = 'auto'; 
                    titleElement.style.marginBottom = 'auto';
                }
                
                cardDiv.appendChild(titleElement);
                return cardDiv;
            },
            
            displayErrorMessage(feedUrl, errorMessage, feedTitleGiven) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-4';
                errorDiv.innerHTML = `
                    <strong class="font-bold">Erro ao carregar feed:</strong>
                    <span class="block sm:inline">${DOMPurify.sanitize(feedTitleGiven || feedUrl)}</span>
                    <p class="text-sm">${DOMPurify.sanitize(errorMessage)}</p>
                `;
                domElements.errorMessagesContainer.appendChild(errorDiv);
            },

            /**
             * Updates the text and styling of the "Mark as Read/Unread" button in the modal
             * based on the read status of the `currentItemInModal`.
             */
            updateModalMarkAsReadButtonText() {
                if (currentItemInModal) {
                    if (storageModule.isItemRead(currentItemInModal)) { // External call to storageModule
                        domElements.modalMarkAsReadButton.textContent = "Marcar como Não Lido";
                        domElements.modalMarkAsReadButton.classList.remove('bg-green-500', 'hover:bg-green-600', 'text-white', 'bg-gray-200', 'hover:bg-gray-300', 'text-gray-700');
                        domElements.modalMarkAsReadButton.classList.add('bg-yellow-400', 'hover:bg-yellow-500', 'text-gray-800');
                    } else {
                        domElements.modalMarkAsReadButton.textContent = "Marcar como Lido";
                        domElements.modalMarkAsReadButton.classList.remove('bg-yellow-400', 'hover:bg-yellow-500', 'text-gray-800','bg-gray-200', 'hover:bg-gray-300', 'text-gray-700');
                        domElements.modalMarkAsReadButton.classList.add('bg-green-500', 'hover:bg-green-600', 'text-white');
                    }
                }
            },

            openModal(item) {
                currentItemInModal = item; 
                domElements.modalTitle.textContent = item.title || "Sem Título";
                domElements.modalContent.innerHTML = DOMPurify.sanitize(item.content || item.description || "<p>Conteúdo não disponível.</p>", { USE_PROFILES: { html: true } });
                
                this.updateModalMarkAsReadButtonText(); 

                if(item.link) {
                    domElements.modalOriginalLink.href = item.link;
                    domElements.modalOriginalLink.style.display = 'inline-block';
                } else {
                    domElements.modalOriginalLink.style.display = 'none';
                }
                domElements.feedItemModal.classList.remove('hidden');
                document.body.style.overflow = 'hidden'; 
            },

            closeModal() {
                domElements.feedItemModal.classList.add('hidden');
                document.body.style.overflow = 'auto'; 
                currentItemInModal = null; 
            }
        };

        /**
         * @namespace storageModule
         * @description Manages all interactions with localStorage for feed sources, read items, and cache.
         */
        const storageModule = {
            /**
             * Loads read item statuses from localStorage into the global `readItems` object.
             * Also triggers cleanup of old read items.
             */
            loadReadItems() {
                try {
                    const storedReadItems = localStorage.getItem(config.READ_ITEMS_STORAGE_KEY);
                    readItems = storedReadItems ? JSON.parse(storedReadItems) : {};
                } catch (e) { readItems = {}; console.error("Erro ao carregar itens lidos:", e); }
                this.cleanupOldReadItems();
            },

            /**
             * Saves the current state of the global `readItems` object to localStorage.
             */
            saveReadItems() {
                try {
                    localStorage.setItem(config.READ_ITEMS_STORAGE_KEY, JSON.stringify(readItems));
                } catch (e) { console.error("Erro ao salvar itens lidos:", e); uiModule.showToast("Erro ao salvar estado de leitura.", "error");} // External call to uiModule
            },

            /**
             * Removes read items from localStorage that have passed their expiry date.
             */
            cleanupOldReadItems() {
                const now = Date.now();
                let changed = false;
                for (const itemId in readItems) {
                    if (now - readItems[itemId] > config.READ_ITEM_EXPIRY_MS) {
                        delete readItems[itemId];
                        changed = true;
                    }
                }
                if (changed) this.saveReadItems();
            },

            /**
             * Checks if a given feed item is marked as read.
             * @param {Object} item - The feed item to check.
             * @returns {boolean} True if the item is read, false otherwise.
             */
            isItemRead(item) {
                return readItems.hasOwnProperty(getItemId(item)); // getItemId is global
            },
            
            /**
             * Loads feed sources from localStorage into the global `feedSources` array.
             * If no sources are found, initializes with default sources.
             */
            loadFeedSourcesFromStorage() {
                try {
                    const storedSources = localStorage.getItem(config.FEED_SOURCES_STORAGE_KEY);
                    if (storedSources) {
                        const parsedSources = JSON.parse(storedSources);
                        feedSources = parsedSources.map(s => ({
                            url: s.url,
                            name: s.name || (s.url ? new URL(s.url).hostname : 'Nome Desconhecido'),
                            isNsfw: s.isNsfw !== undefined ? s.isNsfw : false,
                            tags: Array.isArray(s.tags) ? s.tags : [] 
                        }));
                    } else {
                        feedSources = [...config.DEFAULT_FEED_SOURCES];
                        this.saveFeedSourcesToStorage();
                    }
                } catch (e) {
                    console.error("Erro ao carregar fontes do localStorage:", e);
                    feedSources = [...config.DEFAULT_FEED_SOURCES];
                    this.saveFeedSourcesToStorage();
                }
            },

            /**
             * Saves the current state of the global `feedSources` array to localStorage.
             */
            saveFeedSourcesToStorage() {
                try {
                    localStorage.setItem(config.FEED_SOURCES_STORAGE_KEY, JSON.stringify(feedSources));
                } catch (e) { console.error("Erro ao salvar fontes:", e); uiModule.showToast("Erro ao salvar configurações das fontes.", "error");} // External call to uiModule
            },

            /**
             * Removes cached feed data from localStorage for feeds that are no longer in `feedSources`.
             */
            cleanupOrphanedCacheEntries() {
                const currentFeedUrls = new Set(feedSources.map(s => s.url));
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith(config.CACHE_KEY_PREFIX)) {
                        const cachedUrl = key.substring(config.CACHE_KEY_PREFIX.length);
                        if (!currentFeedUrls.has(cachedUrl)) {
                            try {
                                localStorage.removeItem(key);
                                console.log(`Cache órfão removido: ${key}`);
                            } catch (e) {
                                console.error(`Erro ao remover cache órfão ${key}:`, e);
                            }
                        }
                    }
                }
            }
        };

        /**
         * Gets a unique identifier for a feed item.
         * Uses the item's GUID if available and valid, otherwise falls back to its link.
         * @param {Object} item - The feed item.
         * @param {string} [item.guid] - The GUID of the item.
         * @param {string} item.link - The link to the item.
         * @returns {string} The unique identifier for the item.
         */
        function getItemId(item) {
            if (item.guid && typeof item.guid === 'string' && item.guid.trim() !== '') return item.guid;
            return item.link;
        }

        /**
         * Toggles the read status of a feed item.
         * Updates the `readItems` global state, saves it, and refreshes the UI.
         * @param {Object} item - The feed item whose read status is to be toggled.
         */
        function toggleReadStatus(item) {
            const itemId = getItemId(item);
            if (storageModule.isItemRead(item)) delete readItems[itemId];
            else readItems[itemId] = Date.now();
            storageModule.saveReadItems();
            if (currentItemInModal && getItemId(currentItemInModal) === itemId) uiModule.updateModalMarkAsReadButtonText();
            loadFeeds(currentlyDisplayedFeedUrl, currentlySelectedTag);
        }
        
        /**
         * Handles clicks on feed sources in the sidebar.
         * Toggles display of the selected feed or shows all feeds if already selected.
         * @param {string} clickedUrl - The URL of the feed source that was clicked.
         */
        function handleSidebarFeedClick(clickedUrl) {
            currentlySelectedTag = null; 
            currentlyDisplayedFeedUrl = (currentlyDisplayedFeedUrl === clickedUrl) ? null : clickedUrl;
            loadFeeds(currentlyDisplayedFeedUrl);
        }

        /**
         * Handles clicks on tags in the sidebar.
         * Toggles filtering by the selected tag or shows all feeds if already selected.
         * @param {string|null} tag - The tag name that was clicked, or null to show all.
         */
        function handleTagClick(tag) {
            currentlyDisplayedFeedUrl = null; 
            currentlySelectedTag = (currentlySelectedTag === tag) ? null : tag;
            loadFeeds(null, currentlySelectedTag);
        }

        /**
         * Event listener for the "Save Changes" button in the Edit Source modal.
         * Updates the feed source details in `feedSources` and localStorage.
         * Refreshes the sidebar and potentially the main feed display.
         */
        domElements.saveEditSourceButton.addEventListener('click', () => {
            const url = domElements.editSourceUrlHidden.value;
            const sourceToEdit = feedSources.find(s => s.url === url);
            if (sourceToEdit) {
                sourceToEdit.name = domElements.editSourceNameInput.value.trim() || new URL(url).hostname;
                sourceToEdit.tags = domElements.editSourceTagsInput.value.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag !== '');
                sourceToEdit.isNsfw = domElements.editSourceNsfwCheckbox.checked;
                storageModule.saveFeedSourcesToStorage();
                uiModule.renderSidebarFeedList();
                uiModule.renderTagFilterList(); 
                loadFeeds(currentlyDisplayedFeedUrl, currentlySelectedTag); 
            }
            uiModule.closeEditSourceModal();
        });
        domElements.closeEditSourceModalButton.addEventListener('click', () => uiModule.closeEditSourceModal());
        domElements.cancelEditSourceButton.addEventListener('click', () => uiModule.closeEditSourceModal());

        /**
         * Retrieves and trims values from the new feed input fields.
         * @returns {{newUrl: string, newName: string, tagsString: string, isNsfw: boolean}} The input values.
         */
        function getNewFeedInputValues() {
            const newUrl = domElements.sidebarNewFeedUrlInput.value.trim();
            const newName = domElements.sidebarNewFeedNameInput.value.trim();
            const tagsString = domElements.sidebarNewFeedTagsInput.value.trim();
            const isNsfw = domElements.sidebarNewFeedNsfwInput.checked;
            return { newUrl, newName, tagsString, isNsfw };
        }

        /**
         * Validates the new feed URL.
         * @param {string} newUrl - The URL of the new feed.
         * @param {Array<Object>} currentFeedSources - The current list of feed sources.
         * @returns {boolean} True if validation passes, false otherwise.
         */
        function validateNewFeedInput(newUrl, currentFeedSources) {
            if (!newUrl) {
                uiModule.showToast('Por favor, insira uma URL de feed válida.', 'error');
                return false;
            }
            try {
                new URL(newUrl);
            } catch (_) {
                uiModule.showToast('A URL inserida não parece ser válida.', 'error');
                return false;
            }
            if (currentFeedSources.some(source => source.url === newUrl)) {
                uiModule.showToast('Esta URL de feed já foi adicionada.', 'error');
                return false;
            }
            return true;
        }

        /**
         * Fetches the feed title if a name is not provided.
         * @param {string} newUrl - The URL of the new feed.
         * @param {string} newName - The initial name of the feed (can be empty).
         * @returns {Promise<string>} The determined name for the feed.
         */
        async function fetchFeedTitleIfNeeded(newUrl, newName) {
            if (!newName) {
                try {
                    const feedData = await fetchFeedData(newUrl, true); // fetchFeedData remains global
                    return (feedData && feedData.feed && feedData.feed.title) ? feedData.feed.title : new URL(newUrl).hostname;
                } catch (error) {
                    console.warn(`Não foi possível buscar o título para ${newUrl}, usando hostname. Erro: ${error}`);
                    return new URL(newUrl).hostname;
                }
            }
            return newName;
        }

        /**
         * Updates the feedSources array and UI elements after adding a new feed.
         * @param {{url: string, name: string, isNsfw: boolean, tags: Array<string>}} newFeedData - The data for the new feed.
         */
        function updateFeedSourcesAndUI(newFeedData) {
            feedSources.push(newFeedData);
            storageModule.saveFeedSourcesToStorage();
            uiModule.renderSidebarFeedList();
            uiModule.renderTagFilterList();

            domElements.sidebarNewFeedUrlInput.value = '';
            domElements.sidebarNewFeedNameInput.value = '';
            domElements.sidebarNewFeedTagsInput.value = '';
            domElements.sidebarNewFeedNsfwInput.checked = false;
            domElements.addFeedForm.classList.add('hidden');

            currentlyDisplayedFeedUrl = newFeedData.url;
            currentlySelectedTag = null;
            loadFeeds(newFeedData.url); // loadFeeds remains global
            uiModule.showToast(`Feed "${newFeedData.name}" adicionado com sucesso!`, 'success');
        }

        /**
         * Handles the entire process of adding a new feed.
         * @async
         */
        async function handleAddFeedEvent() {
            const { newUrl, newName: initialName, tagsString, isNsfw } = getNewFeedInputValues();

            if (!validateNewFeedInput(newUrl, feedSources)) {
                return;
            }

            const finalName = await fetchFeedTitleIfNeeded(newUrl, initialName);
            const tagsArray = tagsString.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag !== '');

            updateFeedSourcesAndUI({ url: newUrl, name: finalName, isNsfw: isNsfw, tags: tagsArray });
        }

        /**
         * Handles removing a feed source (currently not directly used by UI button, but available).
         * @param {string} urlToRemove - The URL of the feed to remove.
         */
        function handleRemoveFeedEvent(urlToRemove) { 
            feedSources = feedSources.filter(source => source.url !== urlToRemove);
            storageModule.saveFeedSourcesToStorage();
            try { localStorage.removeItem(config.CACHE_KEY_PREFIX + urlToRemove); } catch (e) { console.error("Erro ao remover cache:", e); }
            uiModule.renderSidebarFeedList();
            uiModule.renderTagFilterList();
            if (currentlyDisplayedFeedUrl === urlToRemove) currentlyDisplayedFeedUrl = null;
            loadFeeds(currentlyDisplayedFeedUrl, currentlySelectedTag); 
        }

        /**
         * Fetches feed data from the rss2json API.
         * Implements caching logic to avoid redundant API calls.
         * @param {string} rssUrl - The URL of the RSS feed to fetch.
         * @param {boolean} [bypassCache=false] - If true, bypasses the cache and fetches fresh data.
         * @returns {Promise<Object>} A promise that resolves to the feed data object or an error object.
         */
        async function fetchFeedData(rssUrl, bypassCache = false) {
            const cacheKey = config.CACHE_KEY_PREFIX + rssUrl;
            const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
            let cachedItem = null;

            try {
                const cachedDataString = localStorage.getItem(cacheKey);
                if (cachedDataString) cachedItem = JSON.parse(cachedDataString);
            } catch (e) { 
                try { localStorage.removeItem(cacheKey); } catch (removeError) { /* ignore */ }
                cachedItem = null; console.error("Erro ao ler cache:", e);
            }

            const dataExistsInCache = cachedItem && cachedItem.data;
            const lastSuccessfulFetchTimestamp = dataExistsInCache ? (cachedItem.lastNetworkFetchTimestamp || 0) : 0;
            const cacheIsFreshEnoughForDirectServe = Date.now() - lastSuccessfulFetchTimestamp < config.API_CACHE_FRESHNESS_MS;

            if (!bypassCache && dataExistsInCache && cacheIsFreshEnoughForDirectServe) {
                return { ...(cachedItem.data), fromCache: true, feedUrl: rssUrl, feedTitle: cachedItem.data.feed.title || rssUrl.split('/')[2] || rssUrl };
            }
            
            try {
                const response = await fetch(apiUrl);
                if (!response.ok) throw new Error(`Erro HTTP: ${response.status} para ${rssUrl}`);
                const freshData = await response.json();
                if (freshData.status !== 'ok') throw new Error(`API rss2json retornou erro: ${freshData.message || 'Erro desconhecido'} para ${rssUrl}`);
                
                try {
                    localStorage.setItem(cacheKey, JSON.stringify({ data: freshData, timestamp: Date.now(), lastNetworkFetchTimestamp: Date.now() }));
                } catch (e) { console.error("Erro ao salvar no cache:", e); uiModule.showToast("Erro ao salvar dados no cache local.", "error");}
                return { ...freshData, fromCache: false, feedUrl: rssUrl, feedTitle: freshData.feed.title || rssUrl.split('/')[2] || rssUrl };
            } catch (networkError) {
                if (dataExistsInCache) {
                    const cacheTimestamp = cachedItem.timestamp || 0; 
                    const isCacheValidForFallback = Date.now() - cacheTimestamp < config.CACHE_DURATION_MS;
                    if (isCacheValidForFallback) {
                        return { ...(cachedItem.data), fromCache: true, fromCacheOnError: true, originalError: networkError.message, feedUrl: rssUrl, feedTitle: cachedItem.data.feed.title || rssUrl.split('/')[2] || rssUrl };
                    } else {
                         try { localStorage.removeItem(cacheKey); } catch (e) { /* ignore */ }
                    }
                }
                return { error: networkError.message, feedUrl: rssUrl, feedTitle: rssUrl.split('/')[2] || rssUrl };
            }
        }

        domElements.modalMarkAsReadButton.addEventListener('click', () => {
            if (currentItemInModal) {
                toggleReadStatus(currentItemInModal);
                uiModule.closeModal(); 
            }
        });

        domElements.closeModalButton.addEventListener('click', () => uiModule.closeModal());
        domElements.feedItemModal.addEventListener('click', (event) => {
            if (event.target === domElements.feedItemModal) uiModule.closeModal();
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && !domElements.feedItemModal.classList.contains('hidden')) uiModule.closeModal();
            if (event.key === 'Escape' && !domElements.editSourceModal.classList.contains('hidden')) uiModule.closeEditSourceModal();
        });

        /**
         * Initializes the UI for loading feeds.
         * Sets global state, updates sidebar, and shows loading indicators.
         * @param {string|null} sourceUrl - The URL of the specific feed to load, or null to load all/by tag.
         * @param {string|null} filterTag - The tag to filter feeds by, or null.
         */
        function initializeFeedLoadUI(sourceUrl, filterTag) { // JSDoc added in previous step
            currentlyDisplayedFeedUrl = sourceUrl;
            currentlySelectedTag = filterTag;
            uiModule.updateSidebarActiveState();
            storageModule.loadReadItems();

            domElements.loadingIndicator.style.display = 'block';
            domElements.feedsContainer.innerHTML = '';
            domElements.errorMessagesContainer.innerHTML = '';
            domElements.activeFilterTitleContainer.classList.add('hidden');

            if (sourceUrl) {
                const source = feedSources.find(s => s.url === sourceUrl);
                if (source) {
                    domElements.activeFilterTitle.textContent = `Exibindo: ${source.name}`;
                    domElements.activeFilterTitleContainer.classList.remove('hidden');
                }
            } else if (filterTag) {
                domElements.activeFilterTitle.textContent = `Exibindo feeds com a tag: ${filterTag}`;
                domElements.activeFilterTitleContainer.classList.remove('hidden');
            }
        }

        /**
         * Determines which feeds to fetch based on the provided source URL or filter tag.
         * @param {string|null} sourceUrl - The URL of a specific feed, or null.
         * @param {string|null} filterTag - The tag to filter by, or null.
         * @returns {Array<Object>} An array of feed source objects to fetch.
         */
        function determineFeedsToFetch(sourceUrl, filterTag) {
            if (feedSources.length === 0 && !sourceUrl && !filterTag) {
                return []; // No sources configured
            }

            let feedsToFetchFrom = [...feedSources];
            if (sourceUrl) {
                feedsToFetchFrom = feedSources.filter(s => s.url === sourceUrl);
            } else if (filterTag) {
                feedsToFetchFrom = feedSources.filter(s => s.tags && s.tags.includes(filterTag));
            }
            return feedsToFetchFrom;
        }

        /**
         * Fetches data for a list of feeds and processes the responses.
         * @param {Array<Object>} feedsToFetch - An array of feed source objects.
         * @returns {Promise<Array<Object>>} A promise that resolves to an array of fetched feed items.
         */
        async function fetchAndProcessFeedData(feedsToFetch) {
            const promises = feedsToFetch.map(source => fetchFeedData(source.url)); // fetchFeedData remains global
            const results = await Promise.allSettled(promises);
            let fetchedItems = [];

            results.forEach(result => {
                if (result.status === 'fulfilled' && result.value) {
                    const feedResponse = result.value;
                    if (feedResponse.error) {
                        uiModule.displayErrorMessage(feedResponse.feedUrl, feedResponse.error, feedResponse.feedTitle);
                    } else if (feedResponse.items && feedResponse.items.length > 0) {
                        const sourceOrigin = feedSources.find(s => s.url === feedResponse.feedUrl);
                        feedResponse.items.forEach(item => {
                            const pubDateTimestamp = item.pubDate ? new Date(item.pubDate).getTime() : 0;
                            if (isNaN(pubDateTimestamp) || pubDateTimestamp === 0) return;

                            const processedItem = {
                                ...item,
                                parsedPubDateTimestamp: pubDateTimestamp,
                                isNsfwSource: sourceOrigin ? sourceOrigin.isNsfw : false
                            };
                            if (!item.thumbnail && feedResponse.feed && feedResponse.feed.image) {
                                processedItem.feedImage = feedResponse.feed.image;
                            }
                            fetchedItems.push(processedItem);
                        });
                    }
                } else if (result.status === 'rejected') {
                    // Find the original source URL corresponding to the failed promise
                    // This requires knowing the order of promises, which is preserved by map and Promise.allSettled
                    const originalSource = feedsToFetch[results.indexOf(result)];
                    const errorMessageText = result.reason ? (result.reason.message || String(result.reason)) : 'Falha desconhecida';
                    if (originalSource) uiModule.displayErrorMessage(originalSource.url, errorMessageText, originalSource.name);
                    else uiModule.displayErrorMessage('URL Desconhecida', errorMessageText, 'Feed Desconhecido');
                }
            });
            return fetchedItems;
        }

        /**
         * Filters and sorts fetched feed items based on read status and publication date.
         * @param {Array<Object>} fetchedItems - An array of fetched feed items.
         * @param {string|null} sourceUrl - The URL of the specific feed loaded (if any).
         * @param {string|null} filterTag - The tag used for filtering (if any).
         * @returns {Array<Object>} A sorted and limited array of items to display.
         */
        function filterAndSortFeedItems(fetchedItems, sourceUrl, filterTag) {
            const unreadDisplayItems = [];
            const readDisplayItems = [];
            fetchedItems.forEach(item => {
                if (storageModule.isItemRead(item)) readDisplayItems.push(item);
                else unreadDisplayItems.push(item);
            });

            unreadDisplayItems.sort((a, b) => b.parsedPubDateTimestamp - a.parsedPubDateTimestamp);
            readDisplayItems.sort((a, b) => b.parsedPubDateTimestamp - a.parsedPubDateTimestamp);
            let allDisplayableItems = [...unreadDisplayItems, ...readDisplayItems];
            
            const itemsToDisplayLimit = (sourceUrl || filterTag) ? 50 : 20;
            return allDisplayableItems.slice(0, itemsToDisplayLimit);
        }

        /**
         * Renders the feed items to the UI or displays a message if no items are available.
         * @param {Array<Object>} itemsToDisplay - The array of feed items to render.
         * @param {string|null} sourceUrl - The URL of the specific feed loaded (if any).
         * @param {string|null} filterTag - The tag used for filtering (if any).
         */
        function renderFeedItemsUI(itemsToDisplay, sourceUrl, filterTag) {
            domElements.loadingIndicator.style.display = 'none';

            if (itemsToDisplay.length === 0) {
                if (domElements.errorMessagesContainer.children.length === 0) {
                    let filterContext = "exibir";
                    if (sourceUrl) filterContext = `a fonte "${feedSources.find(s => s.url === sourceUrl)?.name || sourceUrl}"`;
                    else if (filterTag) filterContext = `a tag "${filterTag}"`;
                    else filterContext = "nenhum filtro aplicado";
                    domElements.feedsContainer.innerHTML = `<p class="text-center text-gray-500 col-span-full">Nenhum item encontrado para ${filterContext}.</p>`;
                } else {
                    domElements.feedsContainer.innerHTML = `<p class="text-center text-gray-500 col-span-full">Nenhum item para exibir. Verifique as mensagens de erro acima.</p>`;
                }
                return;
            }

            const gridDiv = document.createElement('div');
            gridDiv.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6';
            itemsToDisplay.forEach((item, index) => {
                gridDiv.appendChild(uiModule.createCard(item, index));
            });
            domElements.feedsContainer.appendChild(gridDiv);
        }

        /**
         * Main function to orchestrate the loading and display of feeds.
         * @param {string|null} [sourceUrl=null] - The URL of a specific feed to load.
         * @param {string|null} [filterTag=null] - The tag to filter feeds by.
         * @async
         */
        async function loadFeeds(sourceUrl = null, filterTag = null) {
            initializeFeedLoadUI(sourceUrl, filterTag);

            const feedsToFetch = determineFeedsToFetch(sourceUrl, filterTag);

            if (feedsToFetch.length === 0) {
                // Handle cases where no feeds are to be fetched
                if (feedSources.length === 0 && !sourceUrl && !filterTag) {
                     domElements.loadingIndicator.style.display = 'none';
                     domElements.feedsContainer.innerHTML = '<p class="text-center text-gray-500 col-span-full">Nenhuma fonte de feed configurada. Adicione uma na barra lateral.</p>';
                     return;
                }
                let message = "Nenhuma fonte para carregar.";
                if (filterTag && !sourceUrl) message = `Nenhuma fonte encontrada com a tag "${filterTag}".`;
                else if (sourceUrl && !feedsToFetch.some(f => f.url === sourceUrl)) message = `A fonte especificada não foi encontrada.`;
                
                renderFeedItemsUI([], sourceUrl, filterTag); 
                if (domElements.errorMessagesContainer.children.length === 0 && message !== "Nenhuma fonte para carregar.") { 
                     if (message === `A fonte especificada não foi encontrada.` || message === `Nenhuma fonte encontrada com a tag "${filterTag}".`){
                        domElements.feedsContainer.innerHTML = `<p class="text-center text-gray-500 col-span-full">${message}</p>`;
                     }
                }
                return;
            }

            const fetchedItems = await fetchAndProcessFeedData(feedsToFetch);
            const itemsToDisplay = filterAndSortFeedItems(fetchedItems, sourceUrl, filterTag);
            renderFeedItemsUI(itemsToDisplay, sourceUrl, filterTag);
        }
        
        document.addEventListener('DOMContentLoaded', () => {
            storageModule.loadFeedSourcesFromStorage();
            storageModule.loadReadItems(); 
            storageModule.cleanupOrphanedCacheEntries(); 
            uiModule.renderSidebarFeedList();
            uiModule.renderTagFilterList();
            loadFeeds(); 

            // Ensure sidebar is visible on desktop if it's not supposed to be initially hidden by -translate-x-full
            if (window.innerWidth >= 640) { // 640px is Tailwind's default 'sm' breakpoint
                if (domElements.sidebar.classList.contains('-translate-x-full')) {
                     domElements.sidebar.classList.remove('-translate-x-full');
                }
                // No need to add 'translate-x-0' explicitly if '-translate-x-full' is removed,
                // as 'transform' with no translate utility defaults to translate(0,0).
                // Also, the main content margin for desktop is handled by the existing toggle logic for sm:ml-64.
            }
            // On mobile (window.innerWidth < 640), the sidebar will remain hidden due to '-translate-x-full' from HTML.

            domElements.sidebarToggle.addEventListener('click', () => {
                domElements.sidebar.classList.toggle('-translate-x-full');
                domElements.mainContent.classList.toggle('sm:ml-64', !domElements.sidebar.classList.contains('-translate-x-full'));
                domElements.sidebarToggleIconOpen.classList.toggle('hidden');
                domElements.sidebarToggleIconClose.classList.toggle('hidden');
            });

            domElements.toggleAddFeedFormButton.addEventListener('click', () => {
                domElements.addFeedForm.classList.toggle('hidden');
            });

            domElements.sidebarAddFeedButton.addEventListener('click', handleAddFeedEvent);
            [domElements.sidebarNewFeedUrlInput, domElements.sidebarNewFeedNameInput, domElements.sidebarNewFeedTagsInput].forEach(input => {
                input.addEventListener('keypress', (e) => { if (e.key === 'Enter') domElements.sidebarAddFeedButton.click(); });
            });
            
        });
