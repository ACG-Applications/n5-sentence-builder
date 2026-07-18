// ============================================================
// SENTENCE BUILDER - Core Logic (No Tooltips)
// ============================================================

/**
 * SentenceBuilder - Main class for the sentence building game
 */
class SentenceBuilder {
    constructor() {
        // ========== STATE ==========
        this.sprints = [];
        this.activeSprintIndex = 0;
        this.sprintSentences = [];
        this.sentenceIndexMap = {};
        
        this.masteredIndices = new Set();
        this.failedIndices = new Set();
        this.currentCycleSentences = [];
        this.cycleNumber = 1;
        this.allCompleted = false;
        
        this.currentSentenceIndex = -1;
        this.currentSentence = null;
        this.words = [];
        this.blankIndices = [];
        this.wordBank = [];
        this.placements = {};
        this.isSubmitted = false;
        
        this.selectedWordIndex = null;
        this.selectedBlankIndex = null;
        this.showFurigana = true;
        this.showTranslation = false;
        this.ttsSpeed = 1.0;
        this.isSubmitting = false;
        
        this.stats = {
            correct: 0,
            incorrect: 0,
            attempts: 0,
            sentenceAttempts: {},
            sentenceCorrect: {}
        };
        
        this.elements = {};
        
        // Bind methods
        this.init = this.init.bind(this);
        this.loadSprint = this.loadSprint.bind(this);
        this.loadNextSentence = this.loadNextSentence.bind(this);
        this.preparePuzzle = this.preparePuzzle.bind(this);
        this.renderSentence = this.renderSentence.bind(this);
        this.renderWordBank = this.renderWordBank.bind(this);
        this.updateStats = this.updateStats.bind(this);
        this.selectWord = this.selectWord.bind(this);
        this.placeWord = this.placeWord.bind(this);
        this.removeWord = this.removeWord.bind(this);
        this.submitAnswer = this.submitAnswer.bind(this);
        this.validatePlacements = this.validatePlacements.bind(this);
        this.showFeedback = this.showFeedback.bind(this);
        this.showCompletion = this.showCompletion.bind(this);
        this.resetSprint = this.resetSprint.bind(this);
        this.toggleFurigana = this.toggleFurigana.bind(this);
        this.toggleTranslation = this.toggleTranslation.bind(this);
        this.setSpeed = this.setSpeed.bind(this);
        this.speakSentence = this.speakSentence.bind(this);
        this.speakWord = this.speakWord.bind(this);
        this.saveProgress = this.saveProgress.bind(this);
        this.loadProgress = this.loadProgress.bind(this);
        this.getSentenceById = this.getSentenceById.bind(this);
        this.getSprintSentences = this.getSprintSentences.bind(this);
    }

    // ============================================================
    // INITIALIZATION
    // ============================================================
    
    init() {
        console.log('🚀 Initializing Sentence Builder...');
        
        this.elements = {
            sprintSelect: document.getElementById('sprintSelect'),
            furiganaToggle: document.getElementById('furiganaToggle'),
            translationToggle: document.getElementById('translationToggleBtn'),
            sentenceJp: document.getElementById('sentenceJp'),
            sentenceEn: document.getElementById('sentenceEn'),
            sentenceTtsBtn: document.getElementById('sentenceTtsBtn'),
            sentenceHint: document.getElementById('sentenceHint'),
            wordBank: document.getElementById('wordBank'),
            bankCount: document.getElementById('bankCount'),
            submitBtn: document.getElementById('submitBtn'),
            resetBtn: document.getElementById('resetBtn'),
            feedbackArea: document.getElementById('feedbackArea'),
            feedbackTitle: document.getElementById('feedbackTitle'),
            feedbackDetail: document.getElementById('feedbackDetail'),
            progressBar: document.getElementById('progressBar'),
            progressText: document.getElementById('progressText'),
            progressPercent: document.getElementById('progressPercent'),
            correctCount: document.getElementById('correctCount'),
            incorrectCount: document.getElementById('incorrectCount'),
            attemptsCount: document.getElementById('attemptsCount'),
            cycleCount: document.getElementById('cycleCount'),
            masteredCount: document.getElementById('masteredCount'),
            completionOverlay: document.getElementById('completionOverlay'),
            completionStats: document.getElementById('completionStats'),
            compCorrect: document.getElementById('compCorrect'),
            compIncorrect: document.getElementById('compIncorrect'),
            compAttempts: document.getElementById('compAttempts'),
            compCycles: document.getElementById('compCycles'),
            compResetBtn: document.getElementById('compResetBtn'),
            compNextSprintBtn: document.getElementById('compNextSprintBtn')
        };
        
        this.buildSprints();
        this.populateSprintSelector();
        this.loadProgress();
        this.setupEventListeners();
        
        if (this.sprints.length > 0) {
            this.loadSprint(0);
        }
        
        console.log('✅ Sentence Builder initialized!');
    }

    // ============================================================
    // SPRINT MANAGEMENT
    // ============================================================
    
    buildSprints() {
        this.sprints = [];
        
        if (typeof sentencesData === 'undefined' || !sentencesData.length) {
            console.error('❌ sentencesData not found or empty');
            return;
        }
        
        if (typeof sprints !== 'undefined' && Array.isArray(sprints) && sprints.length > 0) {
            this.sprints = sprints;
            console.log('📚 Using sprints from main app:', this.sprints.length);
            return;
        }
        
        const totalSentences = sentencesData.length;
        const sentencesPerSprint = 25;
        const sprintNames = [
            'Time & Daily Routine',
            'Family & People',
            'Location & Direction',
            'Food & Shopping',
            'Weather & Feelings',
            'Hobbies & Giving',
            'Body & Health',
            'House & Objects',
            'Work & School',
            'Mixed Review'
        ];
        
        for (let i = 0; i < totalSentences; i += sentencesPerSprint) {
            const start = i;
            const end = Math.min(i + sentencesPerSprint - 1, totalSentences - 1);
            const sprintNum = Math.floor(i / sentencesPerSprint) + 1;
            const name = sprintNames[sprintNum - 1] || `Sprint ${sprintNum}`;
            this.sprints.push({
                id: sprintNum - 1,
                name: name,
                start: start,
                end: end,
                count: end - start + 1
            });
        }
        
        console.log('📚 Built sprints:', this.sprints.length);
    }

    populateSprintSelector() {
        const select = this.elements.sprintSelect;
        select.innerHTML = '';
        
        for (const sprint of this.sprints) {
            const option = document.createElement('option');
            option.value = sprint.id;
            option.textContent = `${sprint.id + 1}. ${sprint.name} (${sprint.count} sentences)`;
            select.appendChild(option);
        }
        
        if (this.sprints.length > 0) {
            select.value = 0;
        }
    }

    getSprintSentences(sprintIndex) {
        const sprint = this.sprints[sprintIndex];
        if (!sprint) return [];
        
        const sentences = [];
        for (let i = sprint.start; i <= sprint.end; i++) {
            if (sentencesData[i]) {
                sentences.push({
                    index: i,
                    data: sentencesData[i]
                });
            }
        }
        return sentences;
    }

    loadSprint(sprintIndex) {
        console.log(`📚 Loading sprint ${sprintIndex}...`);
        
        this.activeSprintIndex = sprintIndex;
        this.sprintSentences = this.getSprintSentences(sprintIndex);
        
        this.masteredIndices = new Set();
        this.failedIndices = new Set();
        this.currentCycleSentences = [];
        this.cycleNumber = 1;
        this.allCompleted = false;
        
        this.stats = {
            correct: 0,
            incorrect: 0,
            attempts: 0,
            sentenceAttempts: {},
            sentenceCorrect: {}
        };
        
        this.currentCycleSentences = this.sprintSentences.map(s => s.index);
        this.shuffleArray(this.currentCycleSentences);
        
        this.elements.sprintSelect.value = sprintIndex;
        this.elements.completionOverlay.classList.remove('visible');
        this.hideFeedback();
        
        this.loadNextSentence();
        this.updateStats();
        
        console.log(`📚 Sprint ${sprintIndex} loaded with ${this.sprintSentences.length} sentences`);
    }

    // ============================================================
    // SENTENCE LOADING
    // ============================================================
    
    loadNextSentence() {
        if (this.masteredIndices.size === this.sprintSentences.length) {
            this.allCompleted = true;
            this.showCompletion();
            return;
        }
        
        if (this.currentCycleSentences.length === 0) {
            if (this.failedIndices.size === 0) {
                this.allCompleted = true;
                this.showCompletion();
                return;
            }
            
            this.currentCycleSentences = Array.from(this.failedIndices);
            this.failedIndices = new Set();
            this.cycleNumber++;
            this.shuffleArray(this.currentCycleSentences);
            console.log(`🔄 Starting cycle ${this.cycleNumber} with ${this.currentCycleSentences.length} sentences`);
        }
        
        const sentenceIndex = this.currentCycleSentences.shift();
        const sentenceData = sentencesData[sentenceIndex];
        
        if (!sentenceData) {
            console.error(`❌ Sentence at index ${sentenceIndex} not found`);
            this.loadNextSentence();
            return;
        }
        
        this.currentSentenceIndex = sentenceIndex;
        this.currentSentence = sentenceData;
        
        this.preparePuzzle();
        
        this.renderSentence();
        this.renderWordBank();
        this.updateStats();
        this.hideFeedback();
        
        this.elements.submitBtn.disabled = true;
        this.elements.sentenceTtsBtn.disabled = false;
        
        console.log(`📖 Loaded sentence ${this.currentSentenceIndex}: ${this.currentSentence.jp}`);
    }

    // ============================================================
    // PUZZLE PREPARATION
    // ============================================================
    
    preparePuzzle() {
        const jp = this.currentSentence.jp;
        this.words = this.splitSentenceWords(jp);
        
        const totalWords = this.words.length;
        let numBlanks = this.calculateBlanks(totalWords);
        
        // Safety: ensure we have at least 2 blanks if possible
        if (totalWords >= 3 && numBlanks < 2) {
            numBlanks = 2;
        }
        
        // Safety: ensure we don't blank all words
        if (numBlanks >= totalWords) {
            numBlanks = Math.max(1, totalWords - 1);
        }
        
        this.blankIndices = this.selectBlankIndices(totalWords, numBlanks);
        
        // Safety: if blankIndices is still empty, force some blanks
        if (this.blankIndices.length === 0 && totalWords >= 2) {
            this.blankIndices = [0, Math.min(1, totalWords - 1)];
            if (this.blankIndices[0] === this.blankIndices[1]) {
                this.blankIndices = [0, totalWords - 1];
            }
        }
        
        console.log('📊 preparePuzzle - totalWords:', totalWords, 'numBlanks:', numBlanks, 'blankIndices:', this.blankIndices);
        
        this.wordBank = [];
        for (const idx of this.blankIndices) {
            this.wordBank.push({
                ...this.words[idx],
                originalIndex: idx,
                used: false
            });
        }
        
        this.shuffleArray(this.wordBank);
        
        this.placements = {};
        for (const idx of this.blankIndices) {
            this.placements[idx] = null;
        }
        
        this.selectedWordIndex = null;
        this.selectedBlankIndex = null;
        this.isSubmitted = false;
        this.isSubmitting = false;
    }

    splitSentenceWords(jpText) {
        const parts = jpText.split(/\s+/);
        const result = [];
        
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const clean = part.replace(/[（(][^）)]*[）)]/g, '').trim();
            const furigana = this.extractFurigana(part);
            const kanji = this.extractKanji(part);
            const isParticle = this.isParticle(clean);
            
            result.push({
                original: part,
                clean: clean,
                kanji: kanji,
                furigana: furigana,
                index: i,
                isParticle: isParticle
            });
        }
        
        return result;
    }

    calculateBlanks(totalWords) {
        if (totalWords <= 3) return 2;
        if (totalWords <= 6) return 2;
        if (totalWords <= 9) return 3;
        return 4;
    }

    selectBlankIndices(totalWords, numBlanks) {
        const safeNumBlanks = Math.min(numBlanks, totalWords);
        const indices = Array.from({length: totalWords}, (_, i) => i);
        this.shuffleArray(indices);
        const selected = indices.slice(0, safeNumBlanks).sort((a, b) => a - b);
        
        // Ensure we have at least 2 blanks if possible
        if (selected.length < 2 && totalWords >= 3) {
            const fallbackIdx = (selected[0] + 1) % totalWords;
            if (!selected.includes(fallbackIdx)) {
                selected.push(fallbackIdx);
                selected.sort((a, b) => a - b);
            }
        }
        
        return selected;
    }

    extractFurigana(word) {
        const match = word.match(/[（(]([^）)]+)[）)]/);
        return match ? match[1] : '';
    }

    extractKanji(word) {
        return word.replace(/[（(][^）)]*[）)]/g, '').trim();
    }

    isParticle(word) {
        const particles = ['は', 'が', 'を', 'に', 'へ', 'で', 'と', 'も', 'か', 'よ', 'ね', 'から', 'まで', 'より', 'くらい', 'ごろ', 'だけ', 'ほど', 'の', 'には', 'や'];
        return particles.includes(word);
    }

    shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    // ============================================================
    // BUILD DISPLAY WORD (with furigana, NO tooltips)
    // ============================================================
    
    buildDisplayWord(word) {
        if (!word) return '';
        
        // Get the clean word (without furigana markers)
        const cleanWord = word.replace(/[（(][^）)]*[）)]/g, '').trim();
        
        // If furigana is off, strip the furigana markers
        let displayText = word;
        if (!this.showFurigana) {
            displayText = cleanWord;
        }
        
        // Apply furigana HTML if furigana is on
        let displayHtml = displayText;
        if (this.showFurigana) {
            if (typeof buildRubyHTML === 'function') {
                displayHtml = buildRubyHTML(displayText);
            } else {
                // Fallback: manual replacement
                displayHtml = displayText.replace(/([\u4e00-\u9faf\u3400-\u4dbf]+)（([^（）]+)）/g, (_, kanji, furigana) => 
                    `<ruby>${kanji}<rt>${furigana}</rt></ruby>`
                );
                displayHtml = displayHtml.replace(/([\u4e00-\u9faf\u3400-\u4dbf]+)\(([^()]+)\)/g, (_, kanji, furigana) => 
                    `<ruby>${kanji}<rt>${furigana}</rt></ruby>`
                );
            }
        }
        
        return displayHtml;
    }

    // ============================================================
    // RENDERING
    // ============================================================
    
    renderSentence() {
        const container = this.elements.sentenceJp;
        const enContainer = this.elements.sentenceEn;
        
        // Build sentence HTML
        let html = '';
        
        for (let i = 0; i < this.words.length; i++) {
            const word = this.words[i];
            const isBlank = this.blankIndices.includes(i);
            
            if (isBlank) {
                const blankIndex = this.blankIndices.indexOf(i);
                const placedWord = this.placements[i];
                const wordObj = placedWord !== null ? this.wordBank[placedWord] : null;
                
                let slotClass = 'blank-slot';
                let content = '';
                
                if (placedWord !== null && wordObj) {
                    slotClass += ' filled';
                    if (this.isSubmitted) {
                        const isCorrect = this.words[i].clean === wordObj.clean;
                        slotClass += isCorrect ? ' correct' : ' incorrect';
                    }
                    
                    // Display the placed word with furigana (NO tooltips)
                    const displayHtml = this.buildDisplayWord(wordObj.original);
                    content = `<span class="placed-word" data-blank="${i}" data-word-index="${placedWord}">${displayHtml}</span>`;
                } else {
                    // Empty blank
                    content = `<span class="blank-number">${blankIndex + 1}</span>`;
                }
                
                html += `<span class="${slotClass}" data-blank-index="${i}" data-blank-number="${blankIndex + 1}">${content}</span>`;
            } else {
                // Normal word - display with furigana (NO tooltips)
                const displayHtml = this.buildDisplayWord(word.original);
                html += displayHtml;
            }
            
            // Add space between words (except after particles)
            if (i < this.words.length - 1) {
                const nextWord = this.words[i + 1];
                if (!nextWord.isParticle) {
                    html += ' ';
                }
            }
        }
        
        container.innerHTML = html;
        
        // Add click handlers to blank slots
        container.querySelectorAll('.blank-slot').forEach(el => {
            // Remove existing listeners to avoid duplicates
            const newEl = el.cloneNode(true);
            el.parentNode.replaceChild(newEl, el);
            
            newEl.addEventListener('click', () => {
                const blankIndex = parseInt(newEl.dataset.blankIndex);
                if (isNaN(blankIndex)) return;
                
                if (this.placements[blankIndex] !== null) {
                    this.removeWord(blankIndex);
                } else {
                    this.placeWord(blankIndex);
                }
            });
        });
        
        // Add hover effect for blank slots that are empty
        container.querySelectorAll('.blank-slot:not(.filled)').forEach(el => {
            el.addEventListener('mouseenter', () => {
                if (this.selectedWordIndex !== null) {
                    el.classList.add('highlight');
                }
            });
            el.addEventListener('mouseleave', () => {
                el.classList.remove('highlight');
            });
        });
        
        // Render translation
        if (this.showTranslation && this.currentSentence.translation) {
            enContainer.textContent = this.currentSentence.translation;
            enContainer.classList.add('visible');
        } else {
            enContainer.classList.remove('visible');
        }
        
        // Update hint
        if (this.currentSentence.grammarHint) {
            this.elements.sentenceHint.textContent = this.currentSentence.grammarHint;
        } else {
            this.elements.sentenceHint.textContent = '';
        }
        
        this.updateSubmitButton();
    }

    renderWordBank() {
        const container = this.elements.wordBank;
        const countEl = this.elements.bankCount;
        
        const unusedCount = this.wordBank.filter(w => !w.used).length;
        countEl.textContent = `${unusedCount} words`;
        
        if (this.wordBank.length === 0) {
            container.innerHTML = `<span class="empty-bank-message">No words to place!</span>`;
            return;
        }
        
        let html = '';
        
        for (let i = 0; i < this.wordBank.length; i++) {
            const word = this.wordBank[i];
            const isSelected = this.selectedWordIndex === i;
            const isUsed = word.used;
            
            const displayWord = this.buildDisplayWord(word.original);
            const ttsBtn = `<button class="word-tts-btn" data-word-index="${i}" title="🔊 Listen to word">🔊</button>`;
            
            html += `<span class="bank-word ${isSelected ? 'selected' : ''} ${isUsed ? 'used' : ''}" data-word-index="${i}">
                ${displayWord}
                ${!isUsed ? ttsBtn : ''}
            </span>`;
        }
        
        container.innerHTML = html;
        
        // Add click handlers to bank words
        container.querySelectorAll('.bank-word:not(.used)').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target.classList.contains('word-tts-btn')) return;
                
                const index = parseInt(el.dataset.wordIndex);
                if (!isNaN(index)) {
                    this.selectWord(index);
                }
            });
        });
        
        // Add click handlers to TTS buttons
        container.querySelectorAll('.word-tts-btn').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(el.dataset.wordIndex);
                if (!isNaN(index) && this.wordBank[index] && !this.wordBank[index].used) {
                    const word = this.wordBank[index].original;
                    this.speakWord(word);
                }
            });
        });
    }

    updateSubmitButton() {
        const allFilled = this.blankIndices.every(idx => this.placements[idx] !== null);
        const isSubmitting = this.isSubmitting;
        
        this.elements.submitBtn.disabled = !allFilled || isSubmitting || this.allCompleted;
        
        if (isSubmitting) {
            this.elements.submitBtn.textContent = '⏳ Checking...';
        } else if (allFilled) {
            this.elements.submitBtn.textContent = '✅ Submit';
        } else {
            this.elements.submitBtn.textContent = '✅ Submit';
        }
    }

    // ============================================================
    // UI INTERACTIONS
    // ============================================================
    
    selectWord(index) {
        if (this.isSubmitting || this.allCompleted) return;
        if (index < 0 || index >= this.wordBank.length) return;
        if (this.wordBank[index].used) return;
        
        if (this.selectedWordIndex === index) {
            this.selectedWordIndex = null;
            this.renderWordBank();
            return;
        }
        
        this.selectedWordIndex = index;
        this.renderWordBank();
    }

    placeWord(blankIndex) {
        if (this.isSubmitting || this.allCompleted) return;
        if (this.selectedWordIndex === null) return;
        if (this.placements[blankIndex] !== null) return;
        
        const wordIndex = this.selectedWordIndex;
        const word = this.wordBank[wordIndex];
        
        if (word.used) return;
        
        this.placements[blankIndex] = wordIndex;
        word.used = true;
        
        this.selectedWordIndex = null;
        
        this.renderSentence();
        this.renderWordBank();
        this.updateSubmitButton();
        
        const allFilled = this.blankIndices.every(idx => this.placements[idx] !== null);
        if (allFilled) {
            this.elements.submitBtn.disabled = false;
        }
    }

    removeWord(blankIndex) {
        if (this.isSubmitting || this.allCompleted) return;
        if (this.placements[blankIndex] === null) return;
        
        const wordIndex = this.placements[blankIndex];
        this.wordBank[wordIndex].used = false;
        this.placements[blankIndex] = null;
        
        this.renderSentence();
        this.renderWordBank();
        this.updateSubmitButton();
    }

    // ============================================================
    // SUBMIT & VALIDATION
    // ============================================================
    
    submitAnswer() {
        if (this.isSubmitting || this.allCompleted) return;
        
        const allFilled = this.blankIndices.every(idx => this.placements[idx] !== null);
        if (!allFilled) {
            this.showFeedback(false, 'Please fill all blanks before submitting.');
            return;
        }
        
        this.isSubmitting = true;
        this.updateSubmitButton();
        
        const results = this.validatePlacements();
        const allCorrect = results.every(r => r.correct);
        
        this.stats.attempts++;
        if (!this.stats.sentenceAttempts[this.currentSentenceIndex]) {
            this.stats.sentenceAttempts[this.currentSentenceIndex] = 0;
        }
        this.stats.sentenceAttempts[this.currentSentenceIndex]++;
        
        if (allCorrect) {
            this.stats.correct++;
            this.stats.sentenceCorrect[this.currentSentenceIndex] = true;
            this.masteredIndices.add(this.currentSentenceIndex);
            this.failedIndices.delete(this.currentSentenceIndex);
            
            this.showFeedback(true);
            this.isSubmitted = true;
            this.isSubmitting = false;
            this.updateSubmitButton();
            
            this.saveProgress();
            
            setTimeout(() => {
                this.loadNextSentence();
            }, 1500);
            
        } else {
            this.stats.incorrect++;
            this.stats.sentenceCorrect[this.currentSentenceIndex] = false;
            this.failedIndices.add(this.currentSentenceIndex);
            
            this.showFeedback(false, results);
            this.isSubmitted = true;
            this.isSubmitting = false;
            this.updateSubmitButton();
            
            this.saveProgress();
        }
        
        this.updateStats();
        this.renderSentence();
    }

    validatePlacements() {
        const results = [];
        
        for (const blankIndex of this.blankIndices) {
            const wordIndex = this.placements[blankIndex];
            const placedWord = this.wordBank[wordIndex];
            const correctWord = this.words[blankIndex];
            
            const isCorrect = placedWord.clean === correctWord.clean;
            
            results.push({
                blankIndex: blankIndex,
                placed: placedWord,
                correct: correctWord,
                correct: isCorrect
            });
        }
        
        return results;
    }

    // ============================================================
    // FEEDBACK
    // ============================================================
    
    showFeedback(isCorrect, data = null) {
        const area = this.elements.feedbackArea;
        const title = this.elements.feedbackTitle;
        const detail = this.elements.feedbackDetail;
        
        area.classList.add('visible');
        area.className = 'feedback-area visible';
        area.classList.add(isCorrect ? 'success' : 'error');
        
        if (isCorrect) {
            title.textContent = '✅ Correct! Well done!';
            detail.innerHTML = 'You placed all the words correctly!';
        } else {
            title.textContent = '❌ Not quite right.';
            
            let detailHtml = '';
            
            if (data && Array.isArray(data)) {
                const wrongBlanks = data.filter(r => !r.correct);
                if (wrongBlanks.length > 0) {
                    detailHtml += '<p><strong>Correct answers:</strong></p>';
                    for (const wrong of wrongBlanks) {
                        const blankNum = this.blankIndices.indexOf(wrong.blankIndex) + 1;
                        const correctWord = wrong.correct;
                        const placedWord = wrong.placed;
                        const correctDisplay = this.buildDisplayWord(correctWord.original);
                        const placedDisplay = placedWord ? this.buildDisplayWord(placedWord.original) : '???';
                        
                        detailHtml += `
                            <p>
                                Blank ${blankNum}: 
                                <span class="wrong-word">${placedDisplay}</span> 
                                → 
                                <span class="correct-word">${correctDisplay}</span>
                            </p>
                        `;
                    }
                }
            }
            
            if (this.currentSentence.grammarHint) {
                detailHtml += `<div class="grammar-hint">💡 ${this.currentSentence.grammarHint}</div>`;
            }
            
            const correctedSentence = this.buildCorrectSentence();
            detailHtml += `
                <div class="grammar-hint" style="margin-top:8px;">
                    <strong>Correct sentence:</strong><br>
                    ${correctedSentence}
                    <br><br>
                    <button class="action-btn sentence-tts" id="playCorrectBtn" style="font-size:0.8rem;padding:4px 14px;">
                        🔊 Play Correct Sentence
                    </button>
                </div>
            `;
            
            detailHtml += `
                <div style="margin-top:12px;">
                    <button class="action-btn secondary" id="nextAfterWrongBtn" style="font-size:0.85rem;padding:8px 24px;">
                        ➡️ Next Sentence
                    </button>
                </div>
            `;
            
            detail.innerHTML = detailHtml;
            
            const playBtn = document.getElementById('playCorrectBtn');
            if (playBtn) {
                playBtn.addEventListener('click', () => {
                    const jpText = this.currentSentence.jp;
                    if (typeof speakText === 'function') {
                        speakText(jpText, 'ja-JP', this.ttsSpeed);
                    } else if (typeof audioManager !== 'undefined') {
                        audioManager.speak(jpText, 'ja-JP', this.ttsSpeed);
                    }
                });
            }
            
            const nextBtn = document.getElementById('nextAfterWrongBtn');
            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    this.loadNextSentence();
                });
            }
        }
    }

    buildCorrectSentence() {
        let parts = [];
        
        for (let i = 0; i < this.words.length; i++) {
            const word = this.words[i];
            const isBlank = this.blankIndices.includes(i);
            
            if (isBlank) {
                const displayWord = this.buildDisplayWord(word.original);
                parts.push(`<span style="color:#2d7a4a;font-weight:600;">${displayWord}</span>`);
            } else {
                const displayWord = this.buildDisplayWord(word.original);
                parts.push(displayWord);
            }
        }
        
        return parts.join(' ');
    }

    hideFeedback() {
        this.elements.feedbackArea.classList.remove('visible');
        this.elements.feedbackArea.className = 'feedback-area';
    }

    // ============================================================
    // COMPLETION
    // ============================================================
    
    showCompletion() {
        const overlay = this.elements.completionOverlay;
        overlay.classList.add('visible');
        
        this.elements.compCorrect.textContent = this.stats.correct;
        this.elements.compIncorrect.textContent = this.stats.incorrect;
        this.elements.compAttempts.textContent = this.stats.attempts;
        this.elements.compCycles.textContent = this.cycleNumber;
        
        this.elements.submitBtn.disabled = true;
        this.elements.sentenceTtsBtn.disabled = true;
        
        console.log('🎉 Sprint complete!');
    }

    // ============================================================
    // STATS & PROGRESS
    // ============================================================
    
    updateStats() {
        const total = this.sprintSentences.length;
        const mastered = this.masteredIndices.size;
        const progress = total > 0 ? (mastered / total) * 100 : 0;
        
        this.elements.progressBar.style.width = `${progress}%`;
        this.elements.progressText.textContent = `${mastered} / ${total} mastered`;
        this.elements.progressPercent.textContent = `${Math.round(progress)}%`;
        
        this.elements.correctCount.textContent = this.stats.correct;
        this.elements.incorrectCount.textContent = this.stats.incorrect;
        this.elements.attemptsCount.textContent = this.stats.attempts;
        this.elements.cycleCount.textContent = this.cycleNumber;
        this.elements.masteredCount.textContent = mastered;
    }

    saveProgress() {
        try {
            const key = `sentence_builder_${this.activeSprintIndex}`;
            const data = {
                masteredIndices: Array.from(this.masteredIndices),
                failedIndices: Array.from(this.failedIndices),
                currentCycleSentences: this.currentCycleSentences,
                cycleNumber: this.cycleNumber,
                allCompleted: this.allCompleted,
                stats: this.stats
            };
            localStorage.setItem(key, JSON.stringify(data));
            console.log('💾 Progress saved for sprint', this.activeSprintIndex);
        } catch (error) {
            console.error('❌ Error saving progress:', error);
        }
    }

    loadProgress() {
        try {
            const key = `sentence_builder_${this.activeSprintIndex || 0}`;
            const stored = localStorage.getItem(key);
            if (stored) {
                const data = JSON.parse(stored);
                this.masteredIndices = new Set(data.masteredIndices || []);
                this.failedIndices = new Set(data.failedIndices || []);
                this.currentCycleSentences = data.currentCycleSentences || [];
                this.cycleNumber = data.cycleNumber || 1;
                this.allCompleted = data.allCompleted || false;
                this.stats = data.stats || {
                    correct: 0,
                    incorrect: 0,
                    attempts: 0,
                    sentenceAttempts: {},
                    sentenceCorrect: {}
                };
                console.log('📂 Progress loaded for sprint', this.activeSprintIndex);
            }
        } catch (error) {
            console.error('❌ Error saving progress:', error);
        }
    }

    // ============================================================
    // ACTIONS
    // ============================================================
    
    resetSprint() {
        if (this.allCompleted) {
            this.elements.completionOverlay.classList.remove('visible');
        }
        
        this.masteredIndices = new Set();
        this.failedIndices = new Set();
        this.currentCycleSentences = this.sprintSentences.map(s => s.index);
        this.cycleNumber = 1;
        this.allCompleted = false;
        
        this.shuffleArray(this.currentCycleSentences);
        
        this.stats = {
            correct: 0,
            incorrect: 0,
            attempts: 0,
            sentenceAttempts: {},
            sentenceCorrect: {}
        };
        
        this.hideFeedback();
        this.loadNextSentence();
        this.updateStats();
        this.saveProgress();
        
        console.log('⟳ Sprint reset');
    }

    // ============================================================
    // TOGGLES
    // ============================================================
    
    toggleFurigana() {
        this.showFurigana = !this.showFurigana;
        this.elements.furiganaToggle.textContent = this.showFurigana ? '🔤 ON' : '🔤 OFF';
        this.elements.furiganaToggle.classList.toggle('active', this.showFurigana);
        
        // Re-render to apply changes
        this.renderSentence();
        this.renderWordBank();
    }

    toggleTranslation() {
        this.showTranslation = !this.showTranslation;
        this.elements.translationToggle.textContent = this.showTranslation ? '📖 Hide Translation' : '📖 Show Translation';
        this.elements.translationToggle.classList.toggle('active', this.showTranslation);
        this.renderSentence();
    }

    setSpeed(speed) {
        this.ttsSpeed = speed;
        
        document.querySelectorAll('.speed-btn').forEach(el => {
            el.classList.toggle('active', parseFloat(el.dataset.speed) === speed);
        });
        
        if (typeof audioManager !== 'undefined') {
            audioManager.setSpeed(speed);
        }
        
        console.log(`🎤 Speed set to ${speed}x`);
    }

    // ============================================================
    // TTS - Speak the user's current sentence
    // ============================================================
    
    speakSentence() {
        if (!this.currentSentence) return;
        
        let userSentence = '';
        let hasPlacements = false;
        
        for (let i = 0; i < this.words.length; i++) {
            const word = this.words[i];
            const isBlank = this.blankIndices.includes(i);
            
            if (isBlank) {
                const placedWord = this.placements[i];
                if (placedWord !== null) {
                    const wordObj = this.wordBank[placedWord];
                    const cleanWord = wordObj.clean;
                    userSentence += cleanWord;
                    hasPlacements = true;
                } else {
                    userSentence += ' ';
                }
            } else {
                const cleanWord = word.clean;
                userSentence += cleanWord;
            }
            
            if (i < this.words.length - 1) {
                const nextWord = this.words[i + 1];
                if (!nextWord.isParticle) {
                    userSentence += ' ';
                }
            }
        }
        
        userSentence = userSentence.replace(/\s+/g, ' ').trim();
        
        if (!hasPlacements) {
            const message = 'Please place some words from the word bank.';
            if (typeof speakText === 'function') {
                speakText(message, 'en-US', this.ttsSpeed);
            } else if (typeof audioManager !== 'undefined') {
                audioManager.speak(message, 'en-US', this.ttsSpeed);
            }
            return;
        }
        
        if (userSentence.trim() === '' || userSentence.trim() === ' ') {
            const message = 'Please place some words first.';
            if (typeof speakText === 'function') {
                speakText(message, 'en-US', this.ttsSpeed);
            } else if (typeof audioManager !== 'undefined') {
                audioManager.speak(message, 'en-US', this.ttsSpeed);
            }
            return;
        }
        
        if (typeof speakText === 'function') {
            speakText(userSentence, 'ja-JP', this.ttsSpeed);
        } else if (typeof audioManager !== 'undefined') {
            audioManager.speak(userSentence, 'ja-JP', this.ttsSpeed);
        } else {
            console.warn('⚠️ TTS not available');
        }
    }

    speakWord(word) {
        if (!word) return;
        
        const cleanWord = word.replace(/[（(][^）)]*[）)]/g, '').trim();
        
        if (typeof speakWord === 'function') {
            speakWord(cleanWord);
        } else if (typeof speakText === 'function') {
            speakText(cleanWord, 'ja-JP', this.ttsSpeed);
        } else if (typeof audioManager !== 'undefined') {
            audioManager.speak(cleanWord, 'ja-JP', this.ttsSpeed);
        } else {
            console.warn('⚠️ TTS not available');
        }
    }

    // ============================================================
    // EVENT LISTENERS
    // ============================================================
    
    setupEventListeners() {
        this.elements.sprintSelect.addEventListener('change', (e) => {
            const index = parseInt(e.target.value);
            if (!isNaN(index) && index !== this.activeSprintIndex) {
                this.loadSprint(index);
            }
        });
        
        this.elements.furiganaToggle.addEventListener('click', this.toggleFurigana);
        this.elements.translationToggle.addEventListener('click', this.toggleTranslation);
        
        document.querySelectorAll('.speed-btn').forEach(el => {
            el.addEventListener('click', () => {
                const speed = parseFloat(el.dataset.speed);
                if (!isNaN(speed)) {
                    this.setSpeed(speed);
                }
            });
        });
        
        this.elements.submitBtn.addEventListener('click', this.submitAnswer);
        this.elements.resetBtn.addEventListener('click', this.resetSprint);
        this.elements.sentenceTtsBtn.addEventListener('click', this.speakSentence);
        
        this.elements.compResetBtn.addEventListener('click', this.resetSprint);
        this.elements.compNextSprintBtn.addEventListener('click', () => {
            const nextIndex = (this.activeSprintIndex + 1) % this.sprints.length;
            this.elements.sprintSelect.value = nextIndex;
            this.loadSprint(nextIndex);
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !this.elements.submitBtn.disabled) {
                this.submitAnswer();
            }
            if (e.key === 'r' || e.key === 'R') {
                this.resetSprint();
            }
        });
        
        console.log('🎯 Event listeners set up');
    }

    // ============================================================
    // UTILITY
    // ============================================================
    
    getSentenceById(index) {
        return sentencesData[index] || null;
    }

    debug() {
        console.log('=== Sentence Builder Debug ===');
        console.log('Sprint:', this.activeSprintIndex, this.sprints[this.activeSprintIndex]);
        console.log('Sentences in sprint:', this.sprintSentences.length);
        console.log('Mastered:', this.masteredIndices.size, Array.from(this.masteredIndices));
        console.log('Failed:', this.failedIndices.size, Array.from(this.failedIndices));
        console.log('Cycle:', this.cycleNumber, 'Remaining:', this.currentCycleSentences.length);
        console.log('All completed:', this.allCompleted);
        console.log('Stats:', this.stats);
        console.log('Current sentence:', this.currentSentenceIndex);
        console.log('Show furigana:', this.showFurigana);
        console.log('===============================');
    }
}

if (typeof window !== 'undefined') {
    window.SentenceBuilder = SentenceBuilder;
}

console.log('🧩 Sentence Builder module loaded');