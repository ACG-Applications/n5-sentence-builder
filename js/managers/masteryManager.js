// ============================================================
// MASTERY MANAGER - Handles stats, progress, and persistence
// ============================================================

/**
 * MasteryManager - Manages all progress tracking and persistence
 * Completely separate from UI/puzzle logic
 */
class MasteryManager {
  constructor(sprintId = 0) {
    this.sprintId = sprintId;
    this.sprintTotalSentences = 0;

    // Progress tracking
    this.masteredIndices = new Set();
    this.failedIndices = new Set();
    this.currentCycleSentences = [];
    this.cycleNumber = 1;
    this.allCompleted = false;
    this.completionShown = false;

    // Sprint state
    this.sprintStarted = false;

    // Statistics
    this.stats = {
      correct: 0,
      incorrect: 0,
      attempts: 0,
      sentenceAttempts: {},
      sentenceCorrect: {},
    };

    // Mode tracking
    this.primaryMode = "fill";
    this.sprintPrimaryModes = {};
    this.isPracticeMode = false;
    this.currentMode = "fill";
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================

  init(sprintId, totalSentences, defaultMode = "fill") {
    this.sprintId = sprintId;
    this.sprintTotalSentences = totalSentences;
    this.primaryMode = defaultMode;

    const loaded = this.load(sprintId);

    if (!loaded) {
      console.log(`📂 No saved data for sprint ${sprintId}, initializing fresh`);
      this.reset(true);
    } else {
      this.sprintTotalSentences = totalSentences;
      if (!this.currentCycleSentences || this.currentCycleSentences.length === 0) {
        this.currentCycleSentences = Array.from({ length: totalSentences }, (_, i) => i);
        this.shuffleArray(this.currentCycleSentences);
      }
    }

    this.updatePracticeMode(this.currentMode);
    return this;
  }

  // ============================================================
  // PROGRESS TRACKING
  // ============================================================

  trackAttempt(sentenceIndex, isCorrect, mode) {
    // ALWAYS mark sprint as started on ANY attempt
    this.sprintStarted = true;
    
    // Only track stats in primary mode
    if (mode !== this.primaryMode) {
      this.save();
      return this.getProgress();
    }

    // Update attempt count
    this.stats.attempts++;
    if (!this.stats.sentenceAttempts[sentenceIndex]) {
      this.stats.sentenceAttempts[sentenceIndex] = 0;
    }
    this.stats.sentenceAttempts[sentenceIndex]++;

    if (isCorrect) {
      this.stats.correct++;
      this.stats.sentenceCorrect[sentenceIndex] = true;
      this.masteredIndices.add(sentenceIndex);
      this.failedIndices.delete(sentenceIndex);
    } else {
      this.stats.incorrect++;
      this.stats.sentenceCorrect[sentenceIndex] = false;
      this.failedIndices.add(sentenceIndex);
    }

    this.checkCompletion();
    this.save();
    return this.getProgress();
  }

  getNextSentence() {
    if (this.allCompleted) return null;

    if (this.currentCycleSentences.length === 0) {
      if (this.failedIndices.size === 0) {
        this.allCompleted = true;
        this.completionShown = false;
        return null;
      }

      this.currentCycleSentences = Array.from(this.failedIndices);
      this.failedIndices = new Set();
      this.cycleNumber++;
      this.shuffleArray(this.currentCycleSentences);
    }

    return this.currentCycleSentences.shift();
  }

  reset(keepPrimaryMode = true) {
    const primaryMode = keepPrimaryMode ? this.primaryMode : "fill";

    this.masteredIndices = new Set();
    this.failedIndices = new Set();
    this.currentCycleSentences = Array.from({ length: this.sprintTotalSentences }, (_, i) => i);
    this.cycleNumber = 1;
    this.allCompleted = false;
    this.completionShown = false;
    this.sprintStarted = false;
    this.stats = {
      correct: 0,
      incorrect: 0,
      attempts: 0,
      sentenceAttempts: {},
      sentenceCorrect: {},
    };

    if (!keepPrimaryMode) this.primaryMode = primaryMode;

    this.shuffleArray(this.currentCycleSentences);
    this.save();
  }

  /**
   * Reset mastery progress but keep the mode
   * This allows users to switch mastery modes mid-sprint
   */
  resetMasteryProgress() {
    this.reset(true);
    this.sprintStarted = false;
    this.save();
    return true;
  }

  /**
   * Check if primary mode can be changed
   * @returns {boolean} True if mode can be changed
   */
  canChangePrimaryMode() {
    // Can change if: no progress made OR sprint is complete
    return !this.sprintStarted || this.allCompleted;
  }

  // ============================================================
  // PROGRESS QUERIES
  // ============================================================

  getProgress() {
    const total = this.sprintTotalSentences;
    const mastered = this.masteredIndices.size;
    return {
      total: total,
      mastered: mastered,
      progress: total > 0 ? (mastered / total) * 100 : 0,
      isComplete: mastered === total && total > 0,
      isPracticeMode: this.isPracticeMode,
      primaryMode: this.primaryMode,
      sprintStarted: this.sprintStarted,
      isLocked: this.sprintStarted && !this.allCompleted, // NEW: Lock status
    };
  }

  getStats() {
    return {
      ...this.stats,
      cycleNumber: this.cycleNumber,
      allCompleted: this.allCompleted,
    };
  }

  isSentenceMastered(sentenceIndex) {
    return this.masteredIndices.has(sentenceIndex);
  }

  isSentenceFailed(sentenceIndex) {
    return this.failedIndices.has(sentenceIndex);
  }

  getMasteredCount() {
    return this.masteredIndices.size;
  }

  getFailedCount() {
    return this.failedIndices.size;
  }

  // ============================================================
  // MODE MANAGEMENT
  // ============================================================

  setPrimaryMode(mode, currentMode = null) {
    if (!["fill", "order", "select-order"].includes(mode)) {
      console.warn(`Invalid primary mode: ${mode}`);
      return false;
    }

    // Check if mode can be changed
    if (!this.canChangePrimaryMode()) {
      console.warn(`⚠️ Cannot change primary mode mid-sprint. Progress exists in ${this.primaryMode} mode.`);
      return false;
    }

    this.primaryMode = mode;
    this.sprintPrimaryModes[this.sprintId] = mode;
    this.updatePracticeMode(currentMode || this.currentMode);
    this.save();
    return true;
  }

  updatePracticeMode(currentMode) {
    this.currentMode = currentMode;
    // If sprint hasn't been started yet, don't show practice mode
    if (!this.sprintStarted && !this.allCompleted) {
      this.isPracticeMode = false;
    } else {
      this.isPracticeMode = currentMode !== this.primaryMode;
    }
    return this.isPracticeMode;
  }

  getModeStatus() {
    return {
      primaryMode: this.primaryMode,
      currentMode: this.currentMode,
      isPracticeMode: this.isPracticeMode,
      sprintStarted: this.sprintStarted,
      isLocked: this.sprintStarted && !this.allCompleted,
    };
  }

  // ============================================================
  // COMPLETION
  // ============================================================

  checkCompletion() {
    const progress = this.getProgress();
    if (progress.isComplete) {
      this.allCompleted = true;
    }
    return this.allCompleted;
  }

  markCompletionShown() {
    this.completionShown = true;
    this.save();
  }

  shouldShowCompletion() {
    return this.allCompleted && !this.completionShown;
  }

  // ============================================================
  // PERSISTENCE
  // ============================================================

  save() {
    try {
      const key = `sentence_builder_${this.sprintId}`;
      const data = {
        masteredIndices: Array.from(this.masteredIndices),
        failedIndices: Array.from(this.failedIndices),
        currentCycleSentences: this.currentCycleSentences,
        cycleNumber: this.cycleNumber,
        allCompleted: this.allCompleted,
        completionShown: this.completionShown,
        sprintStarted: this.sprintStarted,
        stats: this.stats,
        primaryMode: this.primaryMode,
        sprintPrimaryModes: this.sprintPrimaryModes,
      };
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error("Error saving progress:", error);
      return false;
    }
  }

  load(sprintId) {
    try {
      this.sprintId = sprintId;
      const key = `sentence_builder_${sprintId}`;
      const stored = localStorage.getItem(key);

      if (!stored) return false;

      const data = JSON.parse(stored);

      this.masteredIndices = new Set(data.masteredIndices || []);
      this.failedIndices = new Set(data.failedIndices || []);
      this.currentCycleSentences = data.currentCycleSentences || [];
      this.cycleNumber = data.cycleNumber || 1;
      this.allCompleted = data.allCompleted || false;
      this.completionShown = data.completionShown || false;
      this.sprintStarted = data.sprintStarted || false;
      this.stats = data.stats || {
        correct: 0,
        incorrect: 0,
        attempts: 0,
        sentenceAttempts: {},
        sentenceCorrect: {},
      };

      this.sprintPrimaryModes = data.sprintPrimaryModes || {};
      this.primaryMode = this.sprintPrimaryModes[sprintId] || data.primaryMode || "fill";

      if (!this.currentCycleSentences || this.currentCycleSentences.length === 0) {
        this.currentCycleSentences = Array.from({ length: this.sprintTotalSentences }, (_, i) => i);
        this.shuffleArray(this.currentCycleSentences);
      }

      this.updatePracticeMode(this.currentMode);
      return true;
    } catch (error) {
      console.error("Error loading progress:", error);
      return false;
    }
  }

  clearSavedProgress() {
    try {
      const key = `sentence_builder_${this.sprintId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error("Error clearing progress:", error);
    }
  }

  // ============================================================
  // UTILITY
  // ============================================================

  shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  getSummary() {
    const progress = this.getProgress();
    return (
      `Sprint ${this.sprintId}: ${progress.mastered}/${progress.total} mastered ` +
      `(${Math.round(progress.progress)}%) | Mode: ${this.primaryMode} ` +
      `| Practice: ${this.isPracticeMode ? "ON" : "OFF"} ` +
      `| Started: ${this.sprintStarted ? "YES" : "NO"} ` +
      `| Locked: ${progress.isLocked ? "YES" : "NO"} ` +
      `| Cycle: ${this.cycleNumber} | Attempts: ${this.stats.attempts}`
    );
  }
}

if (typeof window !== "undefined") {
  window.MasteryManager = MasteryManager;
}

console.log("📊 Mastery Manager module loaded");