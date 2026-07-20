// ============================================================
// SENTENCE BUILDER - Core Logic (3 Modes)
// Now using MasteryManager for stats/progress
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

    // Mastery Manager handles all stats/progress
    this.mastery = new MasteryManager(0);

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

    // ========== Mode Support ==========
    this.mode = "fill";
    this.validModes = ["fill", "order", "select-order"];

    // ========== Select & Order specific ==========
    this.distractors = [];
    this.correctWordCount = 0;
    this.totalWordBankSize = 0;

    // ========== Debug Mode ==========
    this.debugMode = false;

    this.elements = {};

    // ========== BIND ALL METHODS ==========
    this.init = this.init.bind(this);
    this.loadSprint = this.loadSprint.bind(this);
    this.loadNextSentence = this.loadNextSentence.bind(this);
    this.preparePuzzle = this.preparePuzzle.bind(this);
    this.preparePuzzleFill = this.preparePuzzleFill.bind(this);
    this.preparePuzzleOrder = this.preparePuzzleOrder.bind(this);
    this.preparePuzzleSelectOrder = this.preparePuzzleSelectOrder.bind(this);
    this.renderSentence = this.renderSentence.bind(this);
    this.renderSentenceFill = this.renderSentenceFill.bind(this);
    this.renderSentenceOrder = this.renderSentenceOrder.bind(this);
    this.renderSentenceSelectOrder = this.renderSentenceSelectOrder.bind(this);
    this.renderWordBank = this.renderWordBank.bind(this);
    this.renderWordBankFill = this.renderWordBankFill.bind(this);
    this.renderWordBankOrder = this.renderWordBankOrder.bind(this);
    this.renderWordBankSelectOrder = this.renderWordBankSelectOrder.bind(this);
    this.renderTranslationAndHint = this.renderTranslationAndHint.bind(this);
    this.updateStats = this.updateStats.bind(this);
    this.selectWord = this.selectWord.bind(this);
    this.placeWord = this.placeWord.bind(this);
    this.placeWordFill = this.placeWordFill.bind(this);
    this.placeWordOrder = this.placeWordOrder.bind(this);
    this.placeWordSelectOrder = this.placeWordSelectOrder.bind(this);
    this.removeWord = this.removeWord.bind(this);
    this.removeWordFill = this.removeWordFill.bind(this);
    this.removeWordOrder = this.removeWordOrder.bind(this);
    this.removeWordSelectOrder = this.removeWordSelectOrder.bind(this);
    this.submitAnswer = this.submitAnswer.bind(this);
    this.submitAnswerFill = this.submitAnswerFill.bind(this);
    this.submitAnswerOrder = this.submitAnswerOrder.bind(this);
    this.submitAnswerSelectOrder = this.submitAnswerSelectOrder.bind(this);
    this.validatePlacementsFill = this.validatePlacementsFill.bind(this);
    this.validateOrder = this.validateOrder.bind(this);
    this.validateSelectOrder = this.validateSelectOrder.bind(this);
    this.showFeedback = this.showFeedback.bind(this);
    this.showFeedbackFillError = this.showFeedbackFillError.bind(this);
    this.showFeedbackOrderError = this.showFeedbackOrderError.bind(this);
    this.showFeedbackSelectOrderError = this.showFeedbackSelectOrderError.bind(this);
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
    this.setMode = this.setMode.bind(this);
    this.changePrimaryMode = this.changePrimaryMode.bind(this);
    this.syncModeUI = this.syncModeUI.bind(this);
    this.syncPrimaryModeUI = this.syncPrimaryModeUI.bind(this);
    this.calculateDistractors = this.calculateDistractors.bind(this);
    this.generateDistractors = this.generateDistractors.bind(this);
    this.fallbackFurigana = this.fallbackFurigana.bind(this);
    this.addBankClickHandlers = this.addBankClickHandlers.bind(this);
    this.addFeedbackButtons = this.addFeedbackButtons.bind(this);
    this.buildCorrectSentence = this.buildCorrectSentence.bind(this);
    this.hideFeedback = this.hideFeedback.bind(this);
    this.updateSubmitButton = this.updateSubmitButton.bind(this);
    this.updateStatsAndFeedback = this.updateStatsAndFeedback.bind(this);
    this.splitSentenceWords = this.splitSentenceWords.bind(this);
    this.calculateBlanks = this.calculateBlanks.bind(this);
    this.selectBlankIndices = this.selectBlankIndices.bind(this);
    this.extractFurigana = this.extractFurigana.bind(this);
    this.extractKanji = this.extractKanji.bind(this);
    this.isParticle = this.isParticle.bind(this);
    this.shuffleArray = this.shuffleArray.bind(this);
    this.buildDisplayWord = this.buildDisplayWord.bind(this);
    this.setupEventListeners = this.setupEventListeners.bind(this);
    this.setupDebugMode = this.setupDebugMode.bind(this);
    this.exposeTestHelpers = this.exposeTestHelpers.bind(this);
    this.autoCompleteSprint = this.autoCompleteSprint.bind(this);
    this.debug = this.debug.bind(this);
    // Helper to reduce duplication
    this.buildCorrectSentenceHTML = this.buildCorrectSentenceHTML.bind(this);
    this.buildPlayButtonHTML = this.buildPlayButtonHTML.bind(this);
    this.buildNextButtonHTML = this.buildNextButtonHTML.bind(this);
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================

  init() {
    console.log("🚀 Initializing Sentence Builder...");

    this.elements = {
      sprintSelect: document.getElementById("sprintSelect"),
      furiganaToggle: document.getElementById("furiganaToggle"),
      translationToggle: document.getElementById("translationToggleBtn"),
      sentenceJp: document.getElementById("sentenceJp"),
      sentenceEn: document.getElementById("sentenceEn"),
      sentenceTtsBtn: document.getElementById("sentenceTtsBtn"),
      sentenceHint: document.getElementById("sentenceHint"),
      wordBank: document.getElementById("wordBank"),
      bankCount: document.getElementById("bankCount"),
      submitBtn: document.getElementById("submitBtn"),
      resetBtn: document.getElementById("resetBtn"),
      feedbackArea: document.getElementById("feedbackArea"),
      feedbackTitle: document.getElementById("feedbackTitle"),
      feedbackDetail: document.getElementById("feedbackDetail"),
      progressBar: document.getElementById("progressBar"),
      progressText: document.getElementById("progressText"),
      progressPercent: document.getElementById("progressPercent"),
      correctCount: document.getElementById("correctCount"),
      incorrectCount: document.getElementById("incorrectCount"),
      attemptsCount: document.getElementById("attemptsCount"),
      cycleCount: document.getElementById("cycleCount"),
      masteredCount: document.getElementById("masteredCount"),
      completionOverlay: document.getElementById("completionOverlay"),
      completionStats: document.getElementById("completionStats"),
      compCorrect: document.getElementById("compCorrect"),
      compIncorrect: document.getElementById("compIncorrect"),
      compAttempts: document.getElementById("compAttempts"),
      compCycles: document.getElementById("compCycles"),
      compResetBtn: document.getElementById("compResetBtn"),
      compNextSprintBtn: document.getElementById("compNextSprintBtn"),
    };

    const data = this.getData();
    if (!data || !data.length) {
      console.error("❌ sentencesData not found!");
      setTimeout(() => this.retryDataLoad(), 500);
      return;
    }

    this.buildSprints();
    this.populateSprintSelector();
    this.loadProgress();
    this.setupEventListeners();
    this.setupDebugMode();
    this.exposeTestHelpers();
    this.syncModeUI();

    if (this.sprints.length > 0) {
      this.loadSprint(0);
    }

    console.log(`✅ Sentence Builder initialized! Mode: ${this.mode}`);
  }

  getData() {
    if (typeof window !== "undefined" && window.sentencesData) {
      console.log(
        "📚 Found sentencesData in window:",
        window.sentencesData.length,
      );
      return window.sentencesData;
    }
    if (typeof sentencesData !== "undefined" && sentencesData) {
      console.log(
        "📚 Found sentencesData in global scope:",
        sentencesData.length,
      );
      return sentencesData;
    }
    return null;
  }

  retryDataLoad() {
    console.log("🔄 Retrying data load...");
    const data = this.getData();
    if (data && data.length) {
      console.log("✅ Data found on retry!");
      this.buildSprints();
      this.populateSprintSelector();
      this.loadProgress();
      this.setupEventListeners();
      this.syncModeUI();
      if (this.sprints.length > 0) {
        this.loadSprint(0);
      }
    }
  }

  // ============================================================
  // MODE UI SYNC
  // ============================================================

  syncModeUI() {
    const buttons = document.querySelectorAll(".mode-btn");
    buttons.forEach((btn) => {
      const isActive = btn.dataset.mode === this.mode;
      btn.classList.toggle("active", isActive);
      btn.style.background = isActive ? "#5a8a6a" : "#faf8f5";
      btn.style.color = isActive ? "white" : "#3d352b";
      btn.style.borderColor = isActive ? "#4a7a5a" : "#d4c9b8";
    });
    console.log(`🎯 UI synced to mode: ${this.mode}`);
  }

  syncPrimaryModeUI() {
    const select = document.getElementById("primaryModeSelect");
    if (select) {
      select.value = this.mastery.primaryMode || "fill";
    }

    const statusEl = document.getElementById("modeStatus");
    if (!statusEl) return;

    const modeLabels = {
      fill: "📝 Fill",
      order: "🔄 Order",
      "select-order": "🎯 Select",
    };
    const label = modeLabels[this.mastery.primaryMode] || "Fill";

    if (this.mastery.isPracticeMode) {
      statusEl.textContent = `🔧 Practice (Mastery: ${label})`;
      statusEl.style.background = "#f0ebe3";
      statusEl.style.color = "#7a6f60";
      statusEl.style.border = "1px solid #d4c9b8";
      statusEl.style.padding = "2px 10px";
      statusEl.style.borderRadius = "12px";
      statusEl.style.fontSize = "0.65rem";
    } else {
      statusEl.textContent = `📊 Mastery: ${label}`;
      statusEl.style.background = "#eaf5ea";
      statusEl.style.color = "#2d7a4a";
      statusEl.style.border = "1px solid #5a8a6a";
      statusEl.style.padding = "2px 10px";
      statusEl.style.borderRadius = "12px";
      statusEl.style.fontSize = "0.65rem";
    }
  }

  // ============================================================
  // SPRINT MANAGEMENT
  // ============================================================

  buildSprints() {
    this.sprints = [];
    const data = this.getData();

    if (!data || !data.length) {
      console.error("❌ sentencesData not found or empty");
      return;
    }

    console.log("📚 Building sprints from", data.length, "sentences");

    // Check if sprints are already defined globally
    if (
      typeof sprints !== "undefined" &&
      Array.isArray(sprints) &&
      sprints.length > 0
    ) {
      this.sprints = sprints;
      console.log("📚 Using sprints from main app:", this.sprints.length);
      return;
    }

    const totalSentences = data.length;
    const sentencesPerSprint = 25;
    const sprintNames = [
      "Time & Daily Routine",
      "Family & People",
      "Location & Direction",
      "Food & Shopping",
      "Weather & Feelings",
      "Hobbies & Giving",
      "Body & Health",
      "House & Objects",
      "Work & School",
      "Mixed Review",
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
        count: end - start + 1,
      });
    }

    console.log("📚 Built sprints:", this.sprints.length);
  }

  populateSprintSelector() {
    const select = this.elements.sprintSelect;
    if (!select) return;
    select.innerHTML = "";

    for (const sprint of this.sprints) {
      const option = document.createElement("option");
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
    const data = this.getData();
    if (!data || !data.length) return [];

    for (let i = sprint.start; i <= sprint.end; i++) {
      if (data[i]) {
        sentences.push({
          index: i,
          data: data[i],
        });
      }
    }
    return sentences;
  }

  loadSprint(sprintIndex) {
    console.log(`📚 Loading sprint ${sprintIndex}...`);

    this.activeSprintIndex = sprintIndex;
    this.sprintSentences = this.getSprintSentences(sprintIndex);

    if (!this.sprintSentences || !this.sprintSentences.length) {
      console.error("❌ No sentences found for sprint", sprintIndex);
      return;
    }

    // Initialize mastery manager
    this.mastery.init(sprintIndex, this.sprintSentences.length, "fill");

    // Update practice mode status
    this.mastery.updatePracticeMode(this.mode);
    this.mastery.save();

    this.elements.sprintSelect.value = sprintIndex;
    this.elements.completionOverlay.classList.remove("visible");
    this.hideFeedback();

    this.syncModeUI();
    this.syncPrimaryModeUI();
    this.loadNextSentence();
    this.updateStats();

    console.log(
      `📚 Sprint ${sprintIndex} loaded with ${this.sprintSentences.length} sentences`,
    );
  }

  // ============================================================
  // SENTENCE LOADING - FIXED
  // ============================================================

  loadNextSentence() {
    // Check if sprint is complete
    if (this.mastery.allCompleted) {
      // In practice mode, cycle through sentences for practice
      if (this.mastery.isPracticeMode) {
        // Get the next sentence in the sprint (cycling)
        const totalSentences = this.sprintSentences.length;
        let nextIndex = this.currentSentenceIndex;
        
        // Find the next index (cycling forward)
        let found = false;
        for (let i = 0; i < totalSentences; i++) {
          nextIndex = (nextIndex + 1) % totalSentences;
          // Check if this sentence exists
          const data = this.getData();
          if (data && data[nextIndex]) {
            found = true;
            break;
          }
        }
        
        if (found) {
          this.currentSentenceIndex = nextIndex;
          this.currentSentence = this.getData()[nextIndex];
          this.preparePuzzle();
          this.renderSentence();
          this.renderWordBank();
          this.updateStats();
          this.hideFeedback();
          this.updateSubmitButton();
          this.elements.sentenceHint.textContent = 
            `💡 Practice mode (${this.mode}). Try the next sentence!`;
          this.elements.sentenceHint.style.color = "#7a6f60";
          return;
        }
      }
      
      // If completion overlay hasn't been shown, show it
      if (this.mastery.shouldShowCompletion()) {
        this.showCompletion();
        this.mastery.markCompletionShown();
        this.mastery.save();
      } else {
        // Already shown completion, allow practice
        this.elements.sentenceHint.textContent =
          "💡 Sprint complete! Try different modes for more practice.";
        this.elements.sentenceHint.style.color = "#7a6f60";
      }
      return;
    }

    // Get next sentence from mastery manager (normal mode)
    const sentenceIndex = this.mastery.getNextSentence();

    if (sentenceIndex === null) {
      // No more sentences, check completion
      if (this.mastery.checkCompletion()) {
        if (this.mastery.shouldShowCompletion()) {
          this.showCompletion();
          this.mastery.markCompletionShown();
          this.mastery.save();
        }
      }
      return;
    }

    // Load the sentence
    const data = this.getData();
    const sentenceData = data && data[sentenceIndex] ? data[sentenceIndex] : null;

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

    console.log(
      `📖 Loaded sentence ${this.currentSentenceIndex}: ${this.currentSentence.jp}`,
    );
  }

  // ============================================================
  // PUZZLE PREPARATION
  // ============================================================

  preparePuzzle() {
    console.log(`🎯 preparePuzzle called, mode: ${this.mode}`);

    switch (this.mode) {
      case "order":
        this.preparePuzzleOrder();
        break;
      case "select-order":
        this.preparePuzzleSelectOrder();
        break;
      default:
        this.preparePuzzleFill();
    }
  }

  preparePuzzleFill() {
    const jp = this.currentSentence.jp;
    this.words = this.splitSentenceWords(jp);

    const totalWords = this.words.length;
    let numBlanks = this.calculateBlanks(totalWords);

    if (totalWords >= 3 && numBlanks < 2) numBlanks = 2;
    if (numBlanks >= totalWords) numBlanks = Math.max(1, totalWords - 1);

    this.blankIndices = this.selectBlankIndices(totalWords, numBlanks);

    if (this.blankIndices.length === 0 && totalWords >= 2) {
      this.blankIndices = [0, Math.min(1, totalWords - 1)];
      if (this.blankIndices[0] === this.blankIndices[1]) {
        this.blankIndices = [0, totalWords - 1];
      }
    }

    this.wordBank = this.blankIndices.map((idx) => ({
      ...this.words[idx],
      originalIndex: idx,
      used: false,
      isDistractor: false,
    }));

    this.shuffleArray(this.wordBank);
    this.resetPlacements();
  }

  preparePuzzleOrder() {
    console.log("📊 preparePuzzleOrder called");
    const jp = this.currentSentence.jp;
    this.words = this.splitSentenceWords(jp);

    this.blankIndices = this.words.map((_, i) => i);

    this.wordBank = this.words.map((word, idx) => ({
      ...word,
      originalIndex: idx,
      used: false,
      orderPosition: null,
      isDistractor: false,
    }));
    this.shuffleArray(this.wordBank);
    this.resetPlacements();

    console.log(`📊 Order mode: ${this.words.length} words`);
  }

  preparePuzzleSelectOrder() {
    console.log("🎯 preparePuzzleSelectOrder called");
    const jp = this.currentSentence.jp;
    this.words = this.splitSentenceWords(jp);
    this.correctWordCount = this.words.length;

    const numDistractors = this.calculateDistractors(this.correctWordCount);
    console.log(
      `🎯 Select mode: ${this.correctWordCount} correct words, ${numDistractors} distractors`,
    );

    this.distractors = this.generateDistractors(numDistractors);

    const allWords = [
      ...this.words.map((w, i) => ({
        ...w,
        isDistractor: false,
        originalIndex: i,
        used: false,
      })),
      ...this.distractors.map((w) => ({
        ...w,
        isDistractor: true,
        originalIndex: -1,
        used: false,
      })),
    ];

    this.shuffleArray(allWords);
    this.wordBank = allWords;
    this.totalWordBankSize = this.wordBank.length;

    this.blankIndices = this.words.map((_, i) => i);
    this.resetPlacements();

    console.log(`📊 Select mode: ${this.wordBank.length} total words`);
  }

  resetPlacements() {
    this.placements = {};
    for (const idx of this.blankIndices) {
      this.placements[idx] = null;
    }
    this.selectedWordIndex = null;
    this.selectedBlankIndex = null;
    this.isSubmitted = false;
    this.isSubmitting = false;
  }

  // ============================================================
  // HELPERS
  // ============================================================

  splitSentenceWords(jpText) {
    const parts = jpText.split(/\s+/);
    const result = [];

    for (const part of parts) {
      // Check if this part contains multiple words with furigana
      const regex = /([\u4e00-\u9faf\u3400-\u4dbf]*[（(][^）)]+[）)])/g;
      let match;
      const splitParts = [];
      let lastEnd = 0;

      while ((match = regex.exec(part)) !== null) {
        const before = part.substring(lastEnd, match.index);
        if (before && before.trim()) {
          splitParts.push(before.trim());
        }
        splitParts.push(match[0]);
        lastEnd = regex.lastIndex;
      }

      if (lastEnd < part.length) {
        const remainingText = part.substring(lastEnd);
        if (remainingText && remainingText.trim()) {
          splitParts.push(remainingText.trim());
        }
      }

      if (splitParts.length > 1) {
        // Process split parts
        for (const seg of splitParts) {
          if (seg && seg.trim()) {
            result.push(this.createWordObject(seg, result.length));
          }
        }
      } else {
        // Check if this word needs furigana from dictionary
        const hasFurigana = /[（(][^）)]+[）)]/.test(part);
        if (!hasFurigana) {
          const clean = part.replace(/[（(][^）)]*[）)]/g, "").trim();
          // Try to get furigana from wordDict
          if (
            typeof wordDict !== "undefined" &&
            wordDict[clean] &&
            wordDict[clean].reading
          ) {
            const reading = wordDict[clean].reading;
            if (reading) {
              const wordWithFurigana = `${clean}（${reading}）`;
              result.push(
                this.createWordObject(wordWithFurigana, result.length),
              );
              continue;
            }
          }
        }
        result.push(this.createWordObject(part, result.length));
      }
    }

    return result;
  }

  createWordObject(part, index) {
    const clean = part.replace(/[（(][^）)]*[）)]/g, "").trim();
    let furigana = this.extractFurigana(part);
    let original = part;

    // If no furigana found, try dictionary
    if (!furigana && typeof wordDict !== "undefined" && wordDict[clean]) {
      const dictEntry = wordDict[clean];
      if (dictEntry.reading) {
        furigana = dictEntry.reading;
        // Always format with furigana in parentheses if it has a reading
        // This ensures particles, counters, and all words show furigana
        original = `${clean}（${furigana}）`;
      }
    }

    // Special handling for particles and common kana-only words
    // If the word is kana-only (no kanji), it should still show furigana if available
    if (
      !furigana &&
      !/[\u4e00-\u9faf\u3400-\u4dbf]/.test(clean) &&
      typeof wordDict !== "undefined" &&
      wordDict[clean]
    ) {
      const dictEntry = wordDict[clean];
      if (dictEntry.reading) {
        furigana = dictEntry.reading;
        original = `${clean}（${furigana}）`;
      }
    }

    const kanji = this.extractKanji(part);
    const isParticle = this.isParticle(clean);

    return {
      original: original,
      clean: clean,
      kanji: kanji,
      furigana: furigana,
      index: index,
      isParticle: isParticle,
    };
  }

  calculateBlanks(totalWords) {
    if (totalWords <= 6) return 2;
    if (totalWords <= 9) return 3;
    return 4;
  }

  calculateDistractors(totalWords) {
    if (totalWords <= 7) return 2;
    if (totalWords <= 10) return 3;
    return 3;
  }

  generateDistractors(count) {
    const allWords = [];
    const usedCleanWords = new Set(this.words.map((w) => w.clean));

    if (typeof wordDict !== "undefined") {
      const dictKeys = Object.keys(wordDict);
      this.shuffleArray(dictKeys);

      for (const key of dictKeys) {
        if (allWords.length >= count * 2) break;
        const clean = key;

        // Skip if already in current sentence
        if (usedCleanWords.has(clean)) continue;

        // Only include words that are entirely hiragana
        // This guarantees the word IS the reading
        if (!/^[\u3040-\u30FF]+$/.test(clean)) continue;

        // Skip if too long or too short
        if (clean.length > 12 || clean.length < 1) continue;

        const dictEntry = wordDict[key];
        const reading = dictEntry.reading || "";

        // Only include if reading matches the word (hiragana-only)
        if (reading !== clean) continue;

        const original = `${clean}（${reading}）`;

        if (!allWords.some((aw) => aw.clean === clean)) {
          allWords.push({
            clean: clean,
            original: original,
            furigana: reading,
            isParticle: this.isParticle(clean),
          });
        }
      }
    }

    this.shuffleArray(allWords);
    const selected = allWords.slice(0, Math.min(count, allWords.length));

    return selected.map((w) => ({
      original: w.original || w.clean,
      clean: w.clean,
      kanji: w.clean,
      furigana: w.furigana || "",
      isParticle: w.isParticle || this.isParticle(w.clean),
      isDistractor: true,
    }));
  }

  selectBlankIndices(totalWords, numBlanks) {
    const safeNumBlanks = Math.min(numBlanks, totalWords);
    const indices = Array.from({ length: totalWords }, (_, i) => i);
    this.shuffleArray(indices);
    const selected = indices.slice(0, safeNumBlanks).sort((a, b) => a - b);

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
    return match ? match[1] : "";
  }

  extractKanji(word) {
    return word.replace(/[（(][^）)]*[）)]/g, "").trim();
  }

  isParticle(word) {
    const particles = [
      "は",
      "が",
      "を",
      "に",
      "へ",
      "で",
      "と",
      "も",
      "か",
      "よ",
      "ね",
      "から",
      "まで",
      "より",
      "くらい",
      "ごろ",
      "だけ",
      "ほど",
      "の",
      "には",
      "や",
    ];
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
  // BUILD DISPLAY WORD - with slot mode support
  // ============================================================
  buildDisplayWord(word, forSlot = false) {
    if (!word) return "";

    // If furigana is off, return clean text
    if (!this.showFurigana) {
      return word.replace(/[（(][^）)]*[）)]/g, "").trim();
    }

    // For Order/Select mode slots, strip furigana (clean text only)
    if (forSlot && (this.mode === "order" || this.mode === "select-order")) {
      return word.replace(/[（(][^）)]*[）)]/g, "").trim();
    }

    // Fill mode with furigana ON - use fallback
    return this.fallbackFurigana(word);
  }

  // ============================================================
  // FALLBACK FURIGANA - Trailing kana INSIDE ruby element
  // ============================================================
  fallbackFurigana(text) {
    if (!text) return "";
    let result = text;

    result = result.replace(
      /([\u4e00-\u9faf\u3400-\u4dbf]+)（([^（）]+)）([\u3040-\u30FF]*)/g,
      (_, kanji, furigana, trailing) =>
        `<ruby>${kanji}<rt>${furigana}</rt>${trailing}</ruby>`,
    );
    result = result.replace(
      /([\u4e00-\u9faf\u3400-\u4dbf]+)\(([^()]+)\)([\u3040-\u30FF]*)/g,
      (_, kanji, furigana, trailing) =>
        `<ruby>${kanji}<rt>${furigana}</rt>${trailing}</ruby>`,
    );

    return result.replace(/[（(][^）)]*[）)]/g, "");
  }

  // ============================================================
  // RENDERING
  // ============================================================

  renderSentence() {
    console.log(`🎨 renderSentence called, mode: ${this.mode}`);

    switch (this.mode) {
      case "order":
        this.renderSentenceOrder();
        break;
      case "select-order":
        this.renderSentenceSelectOrder();
        break;
      default:
        this.renderSentenceFill();
    }
  }

  renderSentenceFill() {
    const container = this.elements.sentenceJp;
    const enContainer = this.elements.sentenceEn;

    let html = "";

    for (let i = 0; i < this.words.length; i++) {
      const word = this.words[i];
      const isBlank = this.blankIndices.includes(i);

      if (isBlank) {
        const blankIndex = this.blankIndices.indexOf(i);
        const placedWord = this.placements[i];
        const wordObj = placedWord !== null ? this.wordBank[placedWord] : null;

        let slotClass = "blank-slot";
        let content = "";

        if (placedWord !== null && wordObj) {
          slotClass += " filled";
          if (this.isSubmitted) {
            const isCorrect = this.words[i].clean === wordObj.clean;
            slotClass += isCorrect ? " correct" : " incorrect";
          }

          const displayHtml = this.buildDisplayWord(wordObj.original);
          content = `<span class="placed-word" data-blank="${i}" data-word-index="${placedWord}">${displayHtml}</span>`;
        } else {
          content = `<span class="blank-number">${blankIndex + 1}</span>`;
        }

        html += `<span class="${slotClass}" data-blank-index="${i}" data-blank-number="${blankIndex + 1}">${content}</span>`;
      } else {
        html += this.buildDisplayWord(word.original);
      }

      if (i < this.words.length - 1) {
        const nextWord = this.words[i + 1];
        if (!nextWord.isParticle) {
          html += " ";
        }
      }
    }

    container.innerHTML = html;
    this.addBlankSlotHandlers(container);
    this.renderTranslationAndHint(enContainer);
  }

  addBlankSlotHandlers(container) {
    container.querySelectorAll(".blank-slot").forEach((el) => {
      const newEl = el.cloneNode(true);
      el.parentNode.replaceChild(newEl, el);

      newEl.addEventListener("click", () => {
        const blankIndex = parseInt(newEl.dataset.blankIndex);
        if (isNaN(blankIndex)) return;

        if (this.placements[blankIndex] !== null) {
          this.removeWord(blankIndex);
        } else {
          this.placeWord(blankIndex);
        }
      });
    });

    container.querySelectorAll(".blank-slot:not(.filled)").forEach((el) => {
      el.addEventListener("mouseenter", () => {
        if (this.selectedWordIndex !== null) {
          el.classList.add("highlight");
        }
      });
      el.addEventListener("mouseleave", () => {
        el.classList.remove("highlight");
      });
    });
  }

  renderSentenceOrder() {
    console.log("🎨 renderSentenceOrder called");
    const container = this.elements.sentenceJp;

    let html = '<div class="order-sentence-container">';

    const hasPlacements = this.blankIndices.some(
      (idx) => this.placements[idx] !== null,
    );

    if (!hasPlacements && !this.isSubmitted) {
      html +=
        '<div class="order-instruction">⬅️ Click words from the bank below to build the sentence</div>';
    }

    html += '<div class="order-slots-wrapper">';

    for (let i = 0; i < this.words.length; i++) {
      const placedWordIndex = this.placements[i];
      const wordObj =
        placedWordIndex !== null ? this.wordBank[placedWordIndex] : null;

      if (wordObj) {
        const displayHtml = this.buildDisplayWord(wordObj.original, true);
        const isCorrect =
          this.isSubmitted && wordObj.clean === this.words[i].clean;

        html += `<span class="order-slot filled ${isCorrect ? "correct" : ""}" 
                        data-position="${i}" 
                        data-word-index="${placedWordIndex}">
                        ${displayHtml}
                        <span class="order-number">${i + 1}</span>
                    </span>`;
      } else {
        html += `<span class="order-slot empty" 
                        data-position="${i}" 
                        data-blank-index="${i}">
                        <span class="order-number">${i + 1}</span>
                        <span class="slot-placeholder">⬜</span>
                    </span>`;
      }

      if (i < this.words.length - 1) {
        html += " ";
      }
    }

    html += "</div></div>";
    container.innerHTML = html;

    container.querySelectorAll(".order-slot.empty").forEach((el) => {
      el.addEventListener("click", () => {
        const blankIndex = parseInt(el.dataset.blankIndex);
        if (!isNaN(blankIndex)) {
          this.placeWordOrder(blankIndex);
        }
      });
    });

    container.querySelectorAll(".order-slot.filled").forEach((el) => {
      el.addEventListener("click", () => {
        const position = parseInt(el.dataset.position);
        if (!isNaN(position)) {
          this.removeWordOrder(position);
        }
      });
    });

    const enContainer = this.elements.sentenceEn;
    this.renderTranslationAndHint(enContainer);
  }

  renderSentenceSelectOrder() {
    console.log("🎨 renderSentenceSelectOrder called");
    const container = this.elements.sentenceJp;

    let html = '<div class="order-sentence-container">';

    html += `<div class="select-mode-instruction">
            📝 Place the <span class="highlight-count">${this.correctWordCount}</span> correct words in the right order 
            <span class="distractor-warning">(ignore the extra words!)</span>
        </div>`;

    html += '<div class="order-slots-wrapper">';

    for (let i = 0; i < this.words.length; i++) {
      const placedWordIndex = this.placements[i];
      const wordObj =
        placedWordIndex !== null ? this.wordBank[placedWordIndex] : null;

      if (wordObj) {
        const displayHtml = this.buildDisplayWord(wordObj.original, true);
        const isCorrect =
          this.isSubmitted &&
          !wordObj.isDistractor &&
          wordObj.clean === this.words[i].clean;
        const isDistractor = this.isSubmitted && wordObj.isDistractor;

        let slotClass = "order-slot filled";
        if (this.isSubmitted) {
          if (isCorrect) slotClass += " correct";
          else if (isDistractor) slotClass += " incorrect";
        }

        html += `<span class="${slotClass}" data-position="${i}" data-word-index="${placedWordIndex}">
                    ${displayHtml}
                    <span class="order-number">${i + 1}</span>
                </span>`;
      } else {
        html += `<span class="order-slot empty" data-position="${i}" data-blank-index="${i}">
                    <span class="order-number">${i + 1}</span>
                    <span class="slot-placeholder">⬜</span>
                </span>`;
      }

      if (i < this.words.length - 1) {
        html += " ";
      }
    }

    html += "</div></div>";
    container.innerHTML = html;

    container.querySelectorAll(".order-slot.empty").forEach((el) => {
      el.addEventListener("click", () => {
        const blankIndex = parseInt(el.dataset.blankIndex);
        if (!isNaN(blankIndex)) {
          this.placeWordSelectOrder(blankIndex);
        }
      });
    });

    container.querySelectorAll(".order-slot.filled").forEach((el) => {
      el.addEventListener("click", () => {
        const position = parseInt(el.dataset.position);
        if (!isNaN(position)) {
          this.removeWordSelectOrder(position);
        }
      });
    });

    const enContainer = this.elements.sentenceEn;
    this.renderTranslationAndHint(enContainer);
  }

  renderTranslationAndHint(enContainer) {
    if (this.showTranslation && this.currentSentence.translation) {
      enContainer.textContent = this.currentSentence.translation;
      enContainer.classList.add("visible");
    } else {
      enContainer.classList.remove("visible");
    }

    // Update hint based on mode status
    const modeStatus = this.mastery.getModeStatus();
    if (modeStatus.isPracticeMode) {
      this.elements.sentenceHint.textContent =
        `💡 Practice mode (${this.mode}). Mastery tracked in ${modeStatus.primaryMode} mode.`;
      this.elements.sentenceHint.style.color = "#7a6f60";
    } else if (!this.mastery.allCompleted) {
      this.elements.sentenceHint.textContent =
        `📊 Mastery mode — your progress counts! (${modeStatus.primaryMode})`;
      this.elements.sentenceHint.style.color = "#2d7a4a";
    }

    this.updateSubmitButton();
  }

  // ============================================================
  // WORD BANK RENDERING
  // ============================================================

  renderWordBank() {
    console.log(`📦 renderWordBank called, mode: ${this.mode}`);

    switch (this.mode) {
      case "order":
        this.renderWordBankOrder();
        break;
      case "select-order":
        this.renderWordBankSelectOrder();
        break;
      default:
        this.renderWordBankFill();
    }
  }

  renderWordBankFill() {
    const container = this.elements.wordBank;
    const countEl = this.elements.bankCount;

    const unusedCount = this.wordBank.filter((w) => !w.used).length;
    countEl.textContent = `${unusedCount} words`;

    if (this.wordBank.length === 0) {
      container.innerHTML = `<span class="empty-bank-message">No words to place!</span>`;
      return;
    }

    let html = "";
    for (let i = 0; i < this.wordBank.length; i++) {
      const word = this.wordBank[i];
      const isSelected = this.selectedWordIndex === i;
      const isUsed = word.used;

      const displayWord = this.buildDisplayWord(word.original);
      const ttsBtn = `<button class="word-tts-btn" data-word-index="${i}" title="🔊 Listen to word">🔊</button>`;

      html += `<span class="bank-word ${isSelected ? "selected" : ""} ${isUsed ? "used" : ""}" data-word-index="${i}">
                ${displayWord}
                ${!isUsed ? ttsBtn : ""}
            </span>`;
    }

    container.innerHTML = html;
    this.addBankClickHandlers(container);
  }

  renderWordBankOrder() {
    const container = this.elements.wordBank;
    const countEl = this.elements.bankCount;

    const unusedCount = this.wordBank.filter((w) => !w.used).length;
    countEl.textContent = `${unusedCount} words remaining`;

    if (this.wordBank.length === 0) {
      container.innerHTML = `<span class="empty-bank-message">No words to place!</span>`;
      return;
    }

    let html = "";
    for (let i = 0; i < this.wordBank.length; i++) {
      const word = this.wordBank[i];
      const isSelected = this.selectedWordIndex === i;
      const isUsed = word.used;

      const displayWord = this.buildDisplayWord(word.original);
      const ttsBtn = `<button class="word-tts-btn" data-word-index="${i}" title="🔊 Listen to word">🔊</button>`;

      html += `<span class="bank-word ${isSelected ? "selected" : ""} ${isUsed ? "used" : ""}" data-word-index="${i}">
                ${displayWord}
                ${!isUsed ? ttsBtn : ""}
            </span>`;
    }

    container.innerHTML = html;
    this.addBankClickHandlers(container);
  }

  renderWordBankSelectOrder() {
    const container = this.elements.wordBank;
    const countEl = this.elements.bankCount;

    const unusedCount = this.wordBank.filter((w) => !w.used).length;
    const totalWords = this.wordBank.length;
    countEl.textContent = `${unusedCount} / ${totalWords} words remaining`;

    if (this.wordBank.length === 0) {
      container.innerHTML = `<span class="empty-bank-message">No words to place!</span>`;
      return;
    }

    let html = "";
    for (let i = 0; i < this.wordBank.length; i++) {
      const word = this.wordBank[i];
      const isUsed = word.used;
      const isSelected = this.selectedWordIndex === i && !isUsed;

      let wordClass = "bank-word";
      if (isUsed) wordClass += " used";
      if (isSelected) wordClass += " selected";

      const displayWord = this.buildDisplayWord(word.original);
      const ttsBtn = `<button class="word-tts-btn" data-word-index="${i}" title="🔊 Listen">🔊</button>`;

      html += `<span class="${wordClass}" data-word-index="${i}">
                ${displayWord}
                ${!isUsed ? ttsBtn : ""}
            </span>`;
    }

    container.innerHTML = html;
    this.addBankClickHandlers(container);
  }

  addBankClickHandlers(container) {
    container.querySelectorAll(".bank-word:not(.used)").forEach((el) => {
      el.addEventListener("click", (e) => {
        if (e.target.classList.contains("word-tts-btn")) return;

        const index = parseInt(el.dataset.wordIndex);
        if (!isNaN(index)) {
          this.selectWord(index);
        }
      });
    });

    container.querySelectorAll(".word-tts-btn").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        const index = parseInt(el.dataset.wordIndex);
        if (
          !isNaN(index) &&
          this.wordBank[index] &&
          !this.wordBank[index].used
        ) {
          this.speakWord(this.wordBank[index].original);
        }
      });
    });
  }

  // ============================================================
  // UPDATE SUBMIT BUTTON
  // ============================================================

  updateSubmitButton() {
    const allFilled = this.blankIndices.every(
      (idx) => this.placements[idx] !== null,
    );
    const isSubmitting = this.isSubmitting;

    // Only disable if not filled or submitting (allow practice even when allCompleted)
    this.elements.submitBtn.disabled = !allFilled || isSubmitting;

    if (isSubmitting) {
      this.elements.submitBtn.textContent = "⏳ Checking...";
    } else {
      this.elements.submitBtn.textContent = "✅ Submit";
    }
  }

  // ============================================================
  // UI INTERACTIONS
  // ============================================================

  selectWord(index) {
    if (this.isSubmitting) return;
    if (index < 0 || index >= this.wordBank.length) return;
    if (this.wordBank[index].used) return;

    if (this.selectedWordIndex === index) {
      this.selectedWordIndex = null;
      this.renderWordBank();
      return;
    }

    this.selectedWordIndex = index;
    this.renderWordBank();

    if (this.mode === "order" || this.mode === "select-order") {
      const firstEmpty = this.blankIndices.find(
        (idx) => this.placements[idx] === null,
      );
      if (firstEmpty !== undefined) {
        const placeMethod =
          this.mode === "order"
            ? this.placeWordOrder.bind(this)
            : this.placeWordSelectOrder.bind(this);
        placeMethod(firstEmpty);
      }
    }
  }

  // ============================================================
  // PLACE & REMOVE WORDS
  // ============================================================

  placeWord(blankIndex) {
    switch (this.mode) {
      case "order":
        this.placeWordOrder(blankIndex);
        break;
      case "select-order":
        this.placeWordSelectOrder(blankIndex);
        break;
      default:
        this.placeWordFill(blankIndex);
    }
  }

  placeWordFill(blankIndex) {
    if (this.isSubmitting) return;
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
  }

  placeWordOrder(blankIndex) {
    if (this.isSubmitting) return;
    if (this.selectedWordIndex === null) return;
    if (this.placements[blankIndex] !== null) return;

    const wordIndex = this.selectedWordIndex;
    const word = this.wordBank[wordIndex];
    if (word.used) return;

    this.placements[blankIndex] = wordIndex;
    word.used = true;
    word.orderPosition = blankIndex;
    this.selectedWordIndex = null;

    this.renderSentenceOrder();
    this.renderWordBank();
    this.updateSubmitButton();
  }

  placeWordSelectOrder(blankIndex) {
    if (this.isSubmitting) return;
    if (this.selectedWordIndex === null) return;
    if (this.placements[blankIndex] !== null) return;

    const wordIndex = this.selectedWordIndex;
    const word = this.wordBank[wordIndex];
    if (word.used) return;

    this.placements[blankIndex] = wordIndex;
    word.used = true;
    this.selectedWordIndex = null;

    this.renderSentenceSelectOrder();
    this.renderWordBank();
    this.updateSubmitButton();
  }

  removeWord(blankIndex) {
    switch (this.mode) {
      case "order":
        this.removeWordOrder(blankIndex);
        break;
      case "select-order":
        this.removeWordSelectOrder(blankIndex);
        break;
      default:
        this.removeWordFill(blankIndex);
    }
  }

  removeWordFill(blankIndex) {
    if (this.isSubmitting) return;
    if (this.placements[blankIndex] === null) return;

    const wordIndex = this.placements[blankIndex];
    this.wordBank[wordIndex].used = false;
    this.placements[blankIndex] = null;

    this.renderSentence();
    this.renderWordBank();
    this.updateSubmitButton();
  }

  removeWordOrder(blankIndex) {
    if (this.isSubmitting) return;
    if (this.placements[blankIndex] === null) return;

    const wordIndex = this.placements[blankIndex];
    const word = this.wordBank[wordIndex];
    word.used = false;
    word.orderPosition = null;
    this.placements[blankIndex] = null;

    this.renderSentenceOrder();
    this.renderWordBank();
    this.updateSubmitButton();
  }

  removeWordSelectOrder(blankIndex) {
    if (this.isSubmitting) return;
    if (this.placements[blankIndex] === null) return;

    const wordIndex = this.placements[blankIndex];
    this.wordBank[wordIndex].used = false;
    this.placements[blankIndex] = null;

    this.renderSentenceSelectOrder();
    this.renderWordBank();
    this.updateSubmitButton();
  }

  // ============================================================
  // SUBMIT & VALIDATION
  // ============================================================

  submitAnswer() {
    if (this.isSubmitting) return;

    switch (this.mode) {
      case "order":
        this.submitAnswerOrder();
        break;
      case "select-order":
        this.submitAnswerSelectOrder();
        break;
      default:
        this.submitAnswerFill();
    }
  }

  submitAnswerFill() {
    const allFilled = this.blankIndices.every(
      (idx) => this.placements[idx] !== null,
    );
    if (!allFilled) {
      this.showFeedback(false, "Please fill all blanks before submitting.");
      return;
    }

    this.isSubmitting = true;
    this.updateSubmitButton();

    const results = this.validatePlacementsFill();
    const allCorrect = results.every((r) => r.correct);

    // Track in mastery manager (ONLY if not in practice mode)
    if (!this.mastery.isPracticeMode) {
      this.mastery.trackAttempt(
        this.currentSentenceIndex,
        allCorrect,
        this.mode,
      );
      this.mastery.save();
    }

    // Show feedback
    if (allCorrect) {
      this.showFeedback(true);
      this.isSubmitted = true;
      this.isSubmitting = false;
      this.updateSubmitButton();
      this.updateStats();

      // If in practice mode, don't auto-advance
      if (this.mastery.isPracticeMode) {
        setTimeout(() => {
          this.isSubmitted = false;
          this.updateSubmitButton();
          this.renderSentence();
        }, 1500);
      } else {
        setTimeout(() => {
          this.loadNextSentence();
        }, 1500);
      }
    } else {
      this.showFeedback(false, results);
      this.isSubmitted = true;
      this.isSubmitting = false;
      this.updateSubmitButton();
      this.updateStats();

      // In practice mode, allow user to continue after seeing feedback
      if (this.mastery.isPracticeMode) {
        this.elements.sentenceHint.textContent = 
          `💡 Practice mode: Click "Next Sentence" to continue, or fix your answer.`;
        this.elements.sentenceHint.style.color = "#7a6f60";
      } else {
        // In mastery mode, allow retry
        setTimeout(() => {
          this.isSubmitted = false;
          this.updateSubmitButton();
        }, 2000);
      }
    }

    this.renderSentence();
  }

  validatePlacementsFill() {
    return this.blankIndices.map((blankIndex) => {
      const wordIndex = this.placements[blankIndex];
      const placedWord = this.wordBank[wordIndex];
      const correctWord = this.words[blankIndex];
      const isCorrect = placedWord.clean === correctWord.clean;

      return {
        blankIndex: blankIndex,
        placed: placedWord,
        correct: correctWord,
        correct: isCorrect,
      };
    });
  }

  submitAnswerOrder() {
    const allFilled = this.blankIndices.every(
      (idx) => this.placements[idx] !== null,
    );
    if (!allFilled) {
      this.showFeedback(false, "Please place all words in the correct order.");
      return;
    }

    this.isSubmitting = true;
    this.updateSubmitButton();

    const { results, allCorrect } = this.validateOrder();

    // Track in mastery manager (ONLY if not in practice mode)
    if (!this.mastery.isPracticeMode) {
      this.mastery.trackAttempt(
        this.currentSentenceIndex,
        allCorrect,
        this.mode,
      );
      this.mastery.save();
    }

    if (allCorrect) {
      this.showFeedback(true);
      this.isSubmitted = true;
      this.isSubmitting = false;
      this.updateSubmitButton();
      this.updateStats();

      if (this.mastery.isPracticeMode) {
        setTimeout(() => {
          this.isSubmitted = false;
          this.updateSubmitButton();
          this.renderSentenceOrder();
        }, 1500);
      } else {
        setTimeout(() => {
          this.loadNextSentence();
        }, 1500);
      }
    } else {
      this.showFeedback(false, results);
      this.isSubmitted = true;
      this.isSubmitting = false;
      this.updateSubmitButton();
      this.updateStats();

      // In practice mode, allow user to continue
      if (this.mastery.isPracticeMode) {
        this.elements.sentenceHint.textContent = 
          `💡 Practice mode: Click "Next Sentence" to continue, or fix your answer.`;
        this.elements.sentenceHint.style.color = "#7a6f60";
      } else {
        setTimeout(() => {
          this.isSubmitted = false;
          this.updateSubmitButton();
        }, 2000);
      }
    }

    this.renderSentenceOrder();
  }

  validateOrder() {
    const results = [];
    let allCorrect = true;

    for (let i = 0; i < this.words.length; i++) {
      const wordIndex = this.placements[i];
      const placedWord = wordIndex !== null ? this.wordBank[wordIndex] : null;
      const correctWord = this.words[i];
      const isCorrect = placedWord && placedWord.clean === correctWord.clean;

      results.push({
        position: i,
        placed: placedWord,
        correct: correctWord,
        isCorrect: isCorrect,
      });

      if (!isCorrect) allCorrect = false;
    }

    return { results, allCorrect };
  }

  submitAnswerSelectOrder() {
    const allFilled = this.blankIndices.every(
      (idx) => this.placements[idx] !== null,
    );
    if (!allFilled) {
      this.showFeedback(false, "Please place all correct words in order.");
      return;
    }

    this.isSubmitting = true;
    this.updateSubmitButton();

    const { results, allCorrect } = this.validateSelectOrder();

    // Track in mastery manager (ONLY if not in practice mode)
    if (!this.mastery.isPracticeMode) {
      this.mastery.trackAttempt(
        this.currentSentenceIndex,
        allCorrect,
        this.mode,
      );
      this.mastery.save();
    }

    if (allCorrect) {
      this.showFeedback(true);
      this.isSubmitted = true;
      this.isSubmitting = false;
      this.updateSubmitButton();
      this.updateStats();

      if (this.mastery.isPracticeMode) {
        setTimeout(() => {
          this.isSubmitted = false;
          this.updateSubmitButton();
          this.renderSentenceSelectOrder();
        }, 1500);
      } else {
        setTimeout(() => {
          this.loadNextSentence();
        }, 1500);
      }
    } else {
      this.showFeedback(false, results);
      this.isSubmitted = true;
      this.isSubmitting = false;
      this.updateSubmitButton();
      this.updateStats();

      // In practice mode, allow user to continue
      if (this.mastery.isPracticeMode) {
        this.elements.sentenceHint.textContent = 
          `💡 Practice mode: Click "Next Sentence" to continue, or fix your answer.`;
        this.elements.sentenceHint.style.color = "#7a6f60";
      } else {
        setTimeout(() => {
          this.isSubmitted = false;
          this.updateSubmitButton();
        }, 2000);
      }
    }

    this.renderSentenceSelectOrder();
  }

  validateSelectOrder() {
    const results = [];
    let allCorrect = true;

    // Check each slot
    for (let i = 0; i < this.words.length; i++) {
      const wordIndex = this.placements[i];
      const placedWord = wordIndex !== null ? this.wordBank[wordIndex] : null;
      const correctWord = this.words[i];

      if (placedWord === null) {
        allCorrect = false;
        results.push({
          position: i,
          placed: null,
          correct: correctWord,
          isCorrect: false,
          error: "missing",
        });
        continue;
      }

      if (placedWord.isDistractor) {
        allCorrect = false;
        results.push({
          position: i,
          placed: placedWord,
          correct: correctWord,
          isCorrect: false,
          error: "distractor",
        });
        continue;
      }

      const isCorrect = placedWord.clean === correctWord.clean;
      if (!isCorrect) allCorrect = false;

      results.push({
        position: i,
        placed: placedWord,
        correct: correctWord,
        isCorrect: isCorrect,
        error: isCorrect ? null : "wrong_order",
      });
    }

    // Check for unused correct words
    const unusedCorrectWords = this.wordBank.filter(
      (w) => !w.used && !w.isDistractor,
    );
    if (unusedCorrectWords.length > 0) {
      allCorrect = false;
      results.push({
        position: -1,
        placed: null,
        correct: unusedCorrectWords[0],
        isCorrect: false,
        error: "missing_word",
        missingWords: unusedCorrectWords.map((w) => w.clean),
      });
    }

    // Check for used distractors
    const usedDistractors = this.wordBank.filter(
      (w) => w.used && w.isDistractor,
    );
    if (
      usedDistractors.length > 0 &&
      !results.some((r) => r.error === "distractor")
    ) {
      allCorrect = false;
      results.push({
        position: -2,
        placed: usedDistractors[0],
        correct: null,
        isCorrect: false,
        error: "distractor_used",
        distractorWords: usedDistractors.map((w) => w.clean),
      });
    }

    return { results, allCorrect };
  }

  // ============================================================
  // SHARED STATS & FEEDBACK
  // ============================================================

  updateStatsAndFeedback(allCorrect, results) {
    // This is now handled in the individual submit methods
    // Kept for compatibility but not used
    console.log("updateStatsAndFeedback called - use submit methods instead");
  }

  // ============================================================
  // FEEDBACK - Helper methods to reduce duplication
  // ============================================================

  buildPlayButtonHTML() {
    return `
      <button class="play-correct-btn" id="playCorrectBtn" title="Play correct sentence" style="
        background: none;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        color: #4a7a8a;
        padding: 0 4px;
        transition: transform 0.15s;
        vertical-align: middle;
        margin-left: 8px;
      ">🔊</button>
    `;
  }

  buildNextButtonHTML() {
    return `
      <div style="margin-top:14px;">
        <button class="action-btn secondary" id="nextAfterWrongBtn" style="font-size:0.85rem;padding:8px 24px;">
          ➡️ Next Sentence
        </button>
      </div>
    `;
  }

  buildCorrectSentenceHTML() {
    const correctedSentence = this.buildCorrectSentence();
    return `
      <div class="grammar-hint" style="margin-top:8px;display:flex;align-items:center;flex-wrap:wrap;gap:4px;">
        <strong>Correct sentence:</strong>
        <span>${correctedSentence}</span>
        ${this.buildPlayButtonHTML()}
      </div>
    `;
  }

  // ============================================================
  // FEEDBACK
  // ============================================================

  showFeedback(isCorrect, data = null) {
    const area = this.elements.feedbackArea;
    const title = this.elements.feedbackTitle;
    const detail = this.elements.feedbackDetail;

    area.classList.add("visible");
    area.className = "feedback-area visible";
    area.classList.add(isCorrect ? "success" : "error");

    if (isCorrect) {
      const practiceNote = this.mastery.isPracticeMode
        ? " (Practice mode)"
        : "";
      const messages = {
        "select-order": `✅ Perfect! Correct words in the right order! 🎉${practiceNote}`,
        order: `✅ Perfect order! Well done! 🎉${practiceNote}`,
        default: `✅ Correct! Well done!${practiceNote}`,
      };
      title.textContent = messages[this.mode] || messages.default;
      detail.innerHTML =
        this.mode === "select-order"
          ? `You selected the right words and arranged them perfectly!${this.mastery.isPracticeMode ? " (Practice mode — stats not tracked)" : ""}`
          : this.mode === "order"
            ? `You arranged all the words correctly!${this.mastery.isPracticeMode ? " (Practice mode — stats not tracked)" : ""}`
            : `You placed all the words correctly!${this.mastery.isPracticeMode ? " (Practice mode — stats not tracked)" : ""}`;
    } else {
      switch (this.mode) {
        case "select-order":
          this.showFeedbackSelectOrderError(data, title, detail);
          break;
        case "order":
          this.showFeedbackOrderError(data, title, detail);
          break;
        default:
          this.showFeedbackFillError(data, title, detail);
      }
    }
  }

  showFeedbackFillError(data, title, detail) {
    title.textContent = "❌ Not quite right.";
    let detailHtml = "";

    if (data && Array.isArray(data)) {
      const wrongBlanks = data.filter((r) => !r.correct);
      if (wrongBlanks.length > 0) {
        detailHtml += "<p><strong>Correct answers:</strong></p>";
        for (const wrong of wrongBlanks) {
          const blankNum = this.blankIndices.indexOf(wrong.blankIndex) + 1;
          const correctDisplay = this.buildDisplayWord(wrong.correct.original);
          const placedDisplay = wrong.placed
            ? this.buildDisplayWord(wrong.placed.original)
            : "???";

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

    detailHtml += this.buildCorrectSentenceHTML();
    detailHtml += this.buildNextButtonHTML();

    detail.innerHTML = detailHtml;
    this.addFeedbackButtons();
  }

  showFeedbackOrderError(data, title, detail) {
    title.textContent = "❌ Not quite right. Check the order:";

    let detailHtml = '<div style="margin-top:8px;">';

    // User's attempt - with color coding showing errors
    detailHtml += "<p><strong>Your attempt:</strong></p>";
    detailHtml +=
      '<p style="font-size:1.1rem;padding:10px;background:rgba(255,255,255,0.6);border-radius:8px;">';
    for (let i = 0; i < this.words.length; i++) {
      const wordIndex = this.placements[i];
      if (wordIndex !== null) {
        const word = this.wordBank[wordIndex];
        const isCorrect = data && data[i] ? data[i].isCorrect : false;
        const displayHtml = this.buildDisplayWord(word.original, true);
        detailHtml += `<span style="${isCorrect ? "color:#2d7a4a;" : "color:#b34a4a;text-decoration:underline;font-weight:bold;"}">${displayHtml}</span>`;
      } else {
        detailHtml += `<span style="color:#b8a58b;">___</span>`;
      }
      if (i < this.words.length - 1) detailHtml += " ";
    }
    detailHtml += "</p>";

    // Correct sentence with play button
    detailHtml +=
      '<p style="margin-top:8px;"><strong>Correct sentence:</strong></p>';
    detailHtml +=
      '<p style="font-size:1.1rem;padding:10px;background:rgba(255,255,255,0.6);border-radius:8px;display:flex;align-items:center;flex-wrap:wrap;gap:4px;">';
    for (let i = 0; i < this.words.length; i++) {
      detailHtml += this.buildDisplayWord(this.words[i].original);
      if (i < this.words.length - 1) detailHtml += " ";
    }
    detailHtml += ` ${this.buildPlayButtonHTML()}`;
    detailHtml += "</p>";

    // Grammar hint
    if (this.currentSentence.grammarHint) {
      detailHtml += `<div class="grammar-hint">💡 ${this.currentSentence.grammarHint}</div>`;
    }

    detailHtml += this.buildNextButtonHTML();
    detailHtml += "</div>";
    detail.innerHTML = detailHtml;
    this.addFeedbackButtons();
  }

  showFeedbackSelectOrderError(data, title, detail) {
    title.textContent = "❌ Not quite right.";

    let detailHtml = '<div style="margin-top:8px;">';

    // Check for missing words - show a simple message
    if (data && Array.isArray(data)) {
      const missingEntry = data.find((r) => r.error === "missing_word");
      if (missingEntry && missingEntry.missingWords) {
        detailHtml += `<p><strong>⚠️ Missing correct words:</strong> ${missingEntry.missingWords.join("、")}</p>`;
      }
    }

    // User's attempt - with color coding showing errors
    detailHtml += "<p><strong>Your attempt:</strong></p>";
    detailHtml +=
      '<p style="font-size:1.1rem;padding:10px;background:rgba(255,255,255,0.6);border-radius:8px;">';
    for (let i = 0; i < this.words.length; i++) {
      const wordIndex = this.placements[i];
      if (wordIndex !== null) {
        const word = this.wordBank[wordIndex];
        const isCorrect = data && data[i] ? data[i].isCorrect : false;
        const displayHtml = this.buildDisplayWord(word.original, true);
        if (word.isDistractor) {
          detailHtml += `<span style="color:#b34a4a;text-decoration:line-through;font-weight:bold;">${displayHtml}⚠️</span>`;
        } else {
          detailHtml += `<span style="${isCorrect ? "color:#2d7a4a;" : "color:#b34a4a;text-decoration:underline;font-weight:bold;"}">${displayHtml}</span>`;
        }
      } else {
        detailHtml += `<span style="color:#b8a58b;">___</span>`;
      }
      if (i < this.words.length - 1) detailHtml += " ";
    }
    detailHtml += "</p>";

    // Correct sentence with play button
    detailHtml +=
      '<p style="margin-top:8px;"><strong>Correct sentence:</strong></p>';
    detailHtml +=
      '<p style="font-size:1.1rem;padding:10px;background:rgba(255,255,255,0.6);border-radius:8px;display:flex;align-items:center;flex-wrap:wrap;gap:4px;">';
    for (let i = 0; i < this.words.length; i++) {
      detailHtml += this.buildDisplayWord(this.words[i].original);
      if (i < this.words.length - 1) detailHtml += " ";
    }
    detailHtml += ` ${this.buildPlayButtonHTML()}`;
    detailHtml += "</p>";

    // Grammar hint
    if (this.currentSentence.grammarHint) {
      detailHtml += `<div class="grammar-hint">💡 ${this.currentSentence.grammarHint}</div>`;
    }

    detailHtml += this.buildNextButtonHTML();
    detailHtml += "</div>";
    detail.innerHTML = detailHtml;
    this.addFeedbackButtons();
  }

  // ============================================================
  // ADD FEEDBACK BUTTONS - FIXED
  // ============================================================

  addFeedbackButtons() {
    // Play Correct Sentence button
    const playBtn = document.getElementById("playCorrectBtn");
    if (playBtn) {
      const newPlayBtn = playBtn.cloneNode(true);
      playBtn.parentNode.replaceChild(newPlayBtn, playBtn);

      // Add hover effect
      newPlayBtn.addEventListener("mouseenter", () => {
        newPlayBtn.style.transform = "scale(1.2)";
      });
      newPlayBtn.addEventListener("mouseleave", () => {
        newPlayBtn.style.transform = "scale(1)";
      });

      newPlayBtn.addEventListener("click", () => {
        const jpText = this.currentSentence.jp;
        console.log("🔊 Playing correct sentence:", jpText);
        if (typeof speakText === "function") {
          speakText(jpText, "ja-JP", this.ttsSpeed);
        } else if (typeof audioManager !== "undefined") {
          audioManager.speak(jpText, "ja-JP", this.ttsSpeed);
        } else {
          console.warn("⚠️ TTS not available for correct sentence");
        }
      });
    }

    // Next Sentence button - FIXED
    const nextBtn = document.getElementById("nextAfterWrongBtn");
    if (nextBtn) {
      const newNextBtn = nextBtn.cloneNode(true);
      nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);

      newNextBtn.addEventListener("click", () => {
        // Reset submission state before loading next
        this.isSubmitted = false;
        this.isSubmitting = false;
        this.updateSubmitButton();
        this.hideFeedback();
        this.loadNextSentence();
      });
    }
  }

  buildCorrectSentence() {
    return this.words
      .map((word, i) => {
        const isBlank = this.blankIndices.includes(i);
        const displayWord = this.buildDisplayWord(word.original);

        if (isBlank) {
          return `<span style="color:#2d7a4a;font-weight:600;">${displayWord}</span>`;
        }
        return displayWord;
      })
      .join(" ");
  }

  hideFeedback() {
    this.elements.feedbackArea.classList.remove("visible");
    this.elements.feedbackArea.className = "feedback-area";
  }

  // ============================================================
  // COMPLETION - FIXED
  // ============================================================

  showCompletion() {
    const overlay = this.elements.completionOverlay;
    overlay.classList.add("visible");

    const stats = this.mastery.getStats();
    const progress = this.mastery.getProgress();
    const modeStatus = this.mastery.getModeStatus();

    const modeLabel =
      modeStatus.primaryMode === "fill"
        ? "📝 Fill"
        : modeStatus.primaryMode === "order"
          ? "🔄 Order"
          : "🎯 Select";

    // Build the completion stats HTML cleanly
    let statsHtml = `
      <p style="color:#5a8a6a;font-weight:500;font-size:1.1rem;">🏆 Mastered in ${modeLabel} mode!</p>
      <p style="color:#3d352b;margin-top:8px;">You've mastered all sentences in this sprint!</p>
      <p style="margin-top:12px;">✅ Correct: <span class="highlight-num">${stats.correct}</span></p>
      <p>❌ Incorrect: <span class="highlight-num">${stats.incorrect}</span></p>
      <p>📝 Total attempts: <span class="highlight-num">${stats.attempts}</span></p>
      <p>🔄 Cycles: <span class="highlight-num">${stats.cycleNumber}</span></p>
    `;

    // Add practice mode info if applicable
    if (modeStatus.isPracticeMode) {
      const modeLabels = {
        fill: "📝 Fill",
        order: "🔄 Order",
        "select-order": "🎯 Select",
      };
      const currentModeLabel = modeLabels[this.mode] || this.mode;
      const primaryModeLabel = modeLabels[modeStatus.primaryMode] || modeStatus.primaryMode;
      
      statsHtml += `
        <p style="color:#7a6f60;font-size:0.85rem;margin-top:12px;padding:8px 12px;background:#f5f0eb;border-radius:8px;border-left:3px solid #b8a58b;">
          💡 You were practicing in <strong>${currentModeLabel}</strong> mode. 
          Mastery is tracked in <strong>${primaryModeLabel}</strong> mode.
        </p>
      `;
    }

    // Replace the entire content
    this.elements.completionStats.innerHTML = statsHtml;

    this.elements.submitBtn.disabled = true;
    this.elements.sentenceTtsBtn.disabled = true;

    console.log(`🎉 Sprint complete! (${modeLabel} mode)`);
  }

  // ============================================================
  // STATS & PROGRESS
  // ============================================================

  updateStats() {
    const progress = this.mastery.getProgress();
    const stats = this.mastery.getStats();
    const modeStatus = this.mastery.getModeStatus();

    // Update progress bar
    this.elements.progressBar.style.width = `${progress.progress}%`;

    // Update progress text with mode context
    const modeLabel =
      modeStatus.primaryMode === "fill"
        ? "📝 Fill"
        : modeStatus.primaryMode === "order"
          ? "🔄 Order"
          : "🎯 Select";

    let progressText = `${progress.mastered} / ${progress.total} mastered (${modeLabel})`;
    if (modeStatus.isPracticeMode) {
      progressText += ` | 🏋️ Practicing: ${this.mode}`;
    }
    this.elements.progressText.textContent = progressText;
    this.elements.progressPercent.textContent = `${Math.round(progress.progress)}%`;

    // Update stats
    this.elements.correctCount.textContent = stats.correct;
    this.elements.incorrectCount.textContent = stats.incorrect;
    this.elements.attemptsCount.textContent = stats.attempts;
    this.elements.cycleCount.textContent = stats.cycleNumber;
    this.elements.masteredCount.textContent = progress.mastered;

    // Visual indicator for practice mode
    if (modeStatus.isPracticeMode) {
      this.elements.masteredCount.style.color = "#b8a58b";
    } else {
      this.elements.masteredCount.style.color = "";
    }

    // Show mode status in hint
    if (modeStatus.isPracticeMode) {
      this.elements.sentenceHint.textContent =
        `💡 Practice mode (${this.mode}). Mastery tracked in ${modeStatus.primaryMode} mode.`;
      this.elements.sentenceHint.style.color = "#7a6f60";
    } else if (!this.mastery.allCompleted) {
      this.elements.sentenceHint.textContent =
        `📊 Mastery mode — your progress counts! (${modeStatus.primaryMode})`;
      this.elements.sentenceHint.style.color = "#2d7a4a";
    }
  }

  // ============================================================
  // ACTIONS
  // ============================================================

  resetSprint() {
    // Reset mastery manager (keep primary mode)
    this.mastery.reset(true);
    this.mastery.save();

    // Hide completion overlay
    this.elements.completionOverlay.classList.remove("visible");

    // Reset UI state
    this.hideFeedback();
    this.loadNextSentence();
    this.updateStats();
    this.syncPrimaryModeUI();

    console.log("⟳ Sprint reset");
  }

  // ============================================================
  // PRIMARY MODE MANAGEMENT
  // ============================================================

  changePrimaryMode(mode) {
    if (!this.validModes.includes(mode)) {
      console.warn(`Invalid primary mode: ${mode}`);
      return;
    }

    console.log(
      `🎯 Changing primary mode from ${this.mastery.primaryMode} to ${mode}`,
    );

    this.mastery.setPrimaryMode(mode, this.mode);
    this.mastery.save();

    this.syncPrimaryModeUI();
    this.updateStats();

    // Reload current sentence to refresh
    if (this.currentSentence) {
      this.preparePuzzle();
      this.renderSentence();
      this.renderWordBank();
      this.hideFeedback();
      this.updateSubmitButton();
    }

    console.log(`✅ Primary mode changed to: ${mode}`);
  }

  // ============================================================
  // MODE SWITCHING
  // ============================================================

  setMode(mode) {
    console.log(`🔄 setMode called with: ${mode}`);

    if (!this.validModes.includes(mode)) {
      console.warn(`⚠️ Invalid mode: ${mode}`);
      return;
    }

    if (this.mode === mode) {
      console.log(`ℹ️ Already in ${mode} mode`);
      return;
    }

    console.log(`🔄 Switching mode from ${this.mode} to ${mode}`);
    this.mode = mode;

    // Update mastery manager's practice mode status
    this.mastery.updatePracticeMode(mode);
    this.mastery.save();

    this.syncModeUI();
    this.syncPrimaryModeUI();

    if (this.currentSentence) {
      console.log(`🔄 Reloading sentence in ${mode} mode`);
      this.preparePuzzle();
      this.renderSentence();
      this.renderWordBank();
      this.hideFeedback();
      this.updateSubmitButton();
      console.log(`✅ Sentence reloaded in ${mode} mode`);
    }

    this.updateStats();
    this.saveProgress();
    console.log(`✅ Mode switched to: ${mode}`);
  }

  // ============================================================
  // TTS
  // ============================================================

  speakSentence() {
    if (!this.currentSentence) return;

    let userSentence = "";
    let hasPlacements = false;

    for (let i = 0; i < this.words.length; i++) {
      const word = this.words[i];
      const isBlank = this.blankIndices.includes(i);

      if (isBlank) {
        const placedWord = this.placements[i];
        if (placedWord !== null) {
          const wordObj = this.wordBank[placedWord];
          userSentence += wordObj.clean;
          hasPlacements = true;
        } else {
          userSentence += " ";
        }
      } else {
        userSentence += word.clean;
      }

      if (i < this.words.length - 1) {
        const nextWord = this.words[i + 1];
        if (!nextWord.isParticle) {
          userSentence += " ";
        }
      }
    }

    userSentence = userSentence.replace(/\s+/g, " ").trim();

    if (!hasPlacements) {
      const message = "Please place some words from the word bank.";
      this.speakWithFallback(message, "en-US");
      return;
    }

    if (userSentence.trim() === "" || userSentence.trim() === " ") {
      const message = "Please place some words first.";
      this.speakWithFallback(message, "en-US");
      return;
    }

    this.speakWithFallback(userSentence, "ja-JP");
  }

  speakWithFallback(text, lang) {
    if (typeof speakText === "function") {
      speakText(text, lang, this.ttsSpeed);
    } else if (typeof audioManager !== "undefined") {
      audioManager.speak(text, lang, this.ttsSpeed);
    } else {
      console.warn("⚠️ TTS not available");
    }
  }

  speakWord(word) {
    if (!word) return;
    const cleanWord = word.replace(/[（(][^）)]*[）)]/g, "").trim();

    if (typeof speakWord === "function") {
      speakWord(cleanWord);
    } else {
      this.speakWithFallback(cleanWord, "ja-JP");
    }
  }

  // ============================================================
  // EVENT LISTENERS
  // ============================================================

  setupEventListeners() {
    console.log("🎯 Setting up event listeners...");

    this.elements.sprintSelect.addEventListener("change", (e) => {
      const index = parseInt(e.target.value);
      if (!isNaN(index) && index !== this.activeSprintIndex) {
        this.loadSprint(index);
      }
    });

    this.elements.furiganaToggle.addEventListener("click", this.toggleFurigana);
    this.elements.translationToggle.addEventListener(
      "click",
      this.toggleTranslation,
    );

    document.querySelectorAll(".speed-btn").forEach((el) => {
      el.addEventListener("click", () => {
        const speed = parseFloat(el.dataset.speed);
        if (!isNaN(speed)) {
          this.setSpeed(speed);
        }
      });
    });

    // Mode buttons
    const modeButtons = document.querySelectorAll(".mode-btn");
    console.log(`🎯 Found ${modeButtons.length} mode buttons`);

    modeButtons.forEach((el) => {
      const mode = el.dataset.mode;
      console.log(`  Button: ${mode}`);

      el.addEventListener("click", () => {
        console.log(`🖱️ Mode button clicked: ${mode}`);
        if (mode && mode !== this.mode) {
          this.setMode(mode);
        }
      });
    });

    // Primary mode selector
    const primaryModeSelect = document.getElementById("primaryModeSelect");
    if (primaryModeSelect) {
      primaryModeSelect.addEventListener("change", (e) => {
        const mode = e.target.value;
        if (mode && this.validModes.includes(mode)) {
          this.changePrimaryMode(mode);
        }
      });
    }

    this.elements.submitBtn.addEventListener("click", this.submitAnswer);
    this.elements.resetBtn.addEventListener("click", this.resetSprint);
    this.elements.sentenceTtsBtn.addEventListener("click", this.speakSentence);

    this.elements.compResetBtn.addEventListener("click", this.resetSprint);
    this.elements.compNextSprintBtn.addEventListener("click", () => {
      const nextIndex = (this.activeSprintIndex + 1) % this.sprints.length;
      this.elements.sprintSelect.value = nextIndex;
      this.loadSprint(nextIndex);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !this.elements.submitBtn.disabled) {
        this.submitAnswer();
      }
      if (e.key === "r" || e.key === "R") {
        this.resetSprint();
      }
    });

    console.log("🎯 Event listeners set up");
  }

  // ============================================================
  // DEBUG MODE & TEST HELPERS
  // ============================================================

  setupDebugMode() {
    document.addEventListener("keydown", (e) => {
      // Toggle debug mode: Ctrl+Shift+D
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        e.preventDefault();
        this.debugMode = !this.debugMode;
        console.log(`🔧 Debug mode: ${this.debugMode ? "ON" : "OFF"}`);
        this.elements.sentenceHint.textContent = this.debugMode
          ? "🔧 Debug Mode ON"
          : "";
        this.elements.sentenceHint.style.color = this.debugMode
          ? "#b34a4a"
          : "";
        return;
      }

      if (!this.debugMode) return;

      // Skip sentence: Ctrl+Right
      if (e.ctrlKey && e.key === "ArrowRight") {
        e.preventDefault();
        if (this.currentSentenceIndex !== -1) {
          this.mastery.masteredIndices.add(this.currentSentenceIndex);
          this.mastery.save();
          this.loadNextSentence();
          this.updateStats();
          console.log("⏭️ Skipped sentence");
        }
      }

      // Mark all mastered: Ctrl+M
      if (e.ctrlKey && e.key === "m") {
        e.preventDefault();
        this.sprintSentences.forEach((s) => {
          this.mastery.masteredIndices.add(s.index);
        });
        this.mastery.save();
        this.loadNextSentence();
        this.updateStats();
        console.log("🏆 All sentences mastered");
      }

      // Reset sprint: Ctrl+R
      if (e.ctrlKey && e.key === "r") {
        e.preventDefault();
        this.resetSprint();
        console.log("⟳ Sprint reset");
      }
    });
  }

  exposeTestHelpers() {
    if (typeof window === "undefined") return;

    window.testHelpers = {
      masterCurrent: () => {
        if (this.currentSentenceIndex !== -1) {
          const idx = this.currentSentenceIndex;
          this.mastery.masteredIndices.add(idx);
          // Only increment if not already mastered
          if (!this.mastery.stats.sentenceCorrect[idx]) {
            this.mastery.stats.correct++;
            this.mastery.stats.attempts++;
            this.mastery.stats.sentenceAttempts[idx] = 1;
            this.mastery.stats.sentenceCorrect[idx] = true;
          }
          this.mastery.save();
          this.loadNextSentence();
          this.updateStats();
          console.log("✅ Marked current sentence as mastered");
        }
      },
      masterAll: () => {
        const total = this.sprintSentences.length;
        this.sprintSentences.forEach((s) => {
          this.mastery.masteredIndices.add(s.index);
        });
        // Set stats correctly
        this.mastery.stats.correct = total;
        this.mastery.stats.attempts = total;
        this.sprintSentences.forEach((s) => {
          this.mastery.stats.sentenceAttempts[s.index] = 1;
          this.mastery.stats.sentenceCorrect[s.index] = true;
        });
        this.mastery.allCompleted = true;
        this.mastery.completionShown = false;
        this.mastery.save();
        this.loadNextSentence();
        this.updateStats();
        console.log(`🏆 All ${total} sentences mastered`);
      },
      completeSprint: () => {
        this.autoCompleteSprint();
      },
      resetSprint: () => {
        this.resetSprint();
        console.log("⟳ Sprint reset");
      },
      setMode: (mode) => {
        this.setMode(mode);
        console.log(`🔄 Switched to ${mode} mode`);
      },
      setPrimaryMode: (mode) => {
        this.changePrimaryMode(mode);
        console.log(`🎯 Primary mode set to ${mode}`);
      },
      state: () => {
        const progress = this.mastery.getProgress();
        const stats = this.mastery.getStats();
        const modeStatus = this.mastery.getModeStatus();
        console.log({
          sprint: this.activeSprintIndex,
          total: progress.total,
          mastered: progress.mastered,
          progress: progress.progress,
          mode: this.mode,
          primaryMode: modeStatus.primaryMode,
          isPracticeMode: modeStatus.isPracticeMode,
          allCompleted: this.mastery.allCompleted,
          stats: stats,
        });
      },
    };

    console.log("🧪 Test helpers available: window.testHelpers");
    console.log("  - masterCurrent()    → Mark current sentence as mastered");
    console.log("  - masterAll()        → Mark all as mastered");
    console.log("  - completeSprint()   → Auto-complete sprint");
    console.log("  - resetSprint()      → Reset sprint");
    console.log("  - setMode(mode)      → Switch modes (fill/order/select-order)");
    console.log("  - setPrimaryMode(mode) → Set mastery mode");
    console.log("  - state()            → Show current state");
  }

  autoCompleteSprint() {
    if (!this.sprintSentences || this.sprintSentences.length === 0) {
      console.warn("No sprint loaded");
      return;
    }

    const total = this.sprintSentences.length;
    console.log(`⚡ Auto-completing ${total} sentences...`);

    // DIRECTLY set mastered indices (no trackAttempt calls)
    this.sprintSentences.forEach((s) => {
      this.mastery.masteredIndices.add(s.index);
    });

    // DIRECTLY set stats (avoid trackAttempt which might double-count)
    this.mastery.stats.correct = total;
    this.mastery.stats.incorrect = 0;
    this.mastery.stats.attempts = total;
    
    this.sprintSentences.forEach((s) => {
      this.mastery.stats.sentenceAttempts[s.index] = 1;
      this.mastery.stats.sentenceCorrect[s.index] = true;
    });

    this.mastery.allCompleted = true;
    this.mastery.completionShown = false;

    this.mastery.save();
    this.updateStats();
    this.loadNextSentence();

    console.log(`✅ Sprint auto-completed! (${total} sentences mastered)`);
  }

  // ============================================================
  // TOGGLES
  // ============================================================

  toggleFurigana() {
    this.showFurigana = !this.showFurigana;
    this.elements.furiganaToggle.textContent = this.showFurigana
      ? "🔤 ON"
      : "🔤 OFF";
    this.elements.furiganaToggle.classList.toggle("active", this.showFurigana);
    this.renderSentence();
    this.renderWordBank();
  }

  toggleTranslation() {
    this.showTranslation = !this.showTranslation;
    this.elements.translationToggle.textContent = this.showTranslation
      ? "📖 Hide Translation"
      : "📖 Show Translation";
    this.elements.translationToggle.classList.toggle(
      "active",
      this.showTranslation,
    );
    this.renderSentence();
  }

  setSpeed(speed) {
    this.ttsSpeed = speed;

    document.querySelectorAll(".speed-btn").forEach((el) => {
      el.classList.toggle("active", parseFloat(el.dataset.speed) === speed);
    });

    if (typeof audioManager !== "undefined") {
      audioManager.setSpeed(speed);
    }

    console.log(`🎤 Speed set to ${speed}x`);
  }

  // ============================================================
  // SAVE / LOAD (delegated to MasteryManager)
  // ============================================================

  saveProgress() {
    this.mastery.save();
    console.log("💾 Progress saved for sprint", this.activeSprintIndex);
  }

  loadProgress() {
    this.mastery.load(this.activeSprintIndex);
    console.log(`📂 Progress loaded for sprint ${this.activeSprintIndex}`);
  }

  // ============================================================
  // UTILITY
  // ============================================================

  getSentenceById(index) {
    const data = this.getData();
    return data && data[index] ? data[index] : null;
  }

  debug() {
    console.log("=== Sentence Builder Debug ===");
    console.log(
      "Sprint:",
      this.activeSprintIndex,
      this.sprints[this.activeSprintIndex],
    );
    console.log("Sentences in sprint:", this.sprintSentences.length);

    const progress = this.mastery.getProgress();
    const stats = this.mastery.getStats();
    const modeStatus = this.mastery.getModeStatus();

    console.log("Mastered:", progress.mastered, "/", progress.total);
    console.log("Failed:", this.mastery.getFailedCount());
    console.log("Cycle:", stats.cycleNumber);
    console.log("All completed:", this.mastery.allCompleted);
    console.log("Stats:", stats);
    console.log("Current sentence:", this.currentSentenceIndex);
    console.log("Show furigana:", this.showFurigana);
    console.log("Mode:", this.mode);
    console.log("Primary mode:", modeStatus.primaryMode);
    console.log("Practice mode:", modeStatus.isPracticeMode);
    if (this.mode === "select-order") {
      console.log("Distractors:", this.distractors.length);
      console.log("Correct words:", this.correctWordCount);
      console.log("Total bank:", this.totalWordBankSize);
    }
    console.log("===============================");
  }
}

if (typeof window !== "undefined") {
  window.SentenceBuilder = SentenceBuilder;
}

console.log("🧩 Sentence Builder module loaded");