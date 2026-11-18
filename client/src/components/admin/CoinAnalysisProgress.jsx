import React, { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  FiCheck,
  FiClock,
  FiAlertCircle,
  FiCpu,
  FiCheckCircle,
  FiRefreshCw,
  FiZap,
} from 'react-icons/fi';

const STAGE_ORDER = [
  { id: 'preparing_image', label: 'Preparing uploaded image', defaultPct: 10 },
  { id: 'optimizing_image', label: 'Optimizing image quality', defaultPct: 20 },
  { id: 'connecting_gemini', label: 'Connecting to Gemini AI', defaultPct: 30 },
  { id: 'identifying_coin', label: 'Identifying coin details', defaultPct: 45 },
  { id: 'analyzing_details', label: 'Analyzing denomination, year, country and mint', defaultPct: 60 },
  { id: 'analyzing_condition', label: 'Analyzing rarity and condition', defaultPct: 70 },
  { id: 'generating_results', label: 'Generating structured coin information', defaultPct: 80 },
  { id: 'validating_response', label: 'Validating AI response', defaultPct: 90 },
  { id: 'saving_results', label: 'Saving analysis results', defaultPct: 95 },
  { id: 'completed', label: 'Analysis completed', defaultPct: 100 },
];

/**
 * Format seconds into MM:SS format
 */
const formatTime = (totalSeconds) => {
  if (totalSeconds === null || totalSeconds === undefined || isNaN(totalSeconds) || totalSeconds < 0) {
    return '00:00';
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return `${mm}:${ss}`;
};

const CoinAnalysisProgress = ({
  progressState,
  onRetry,
  onDismiss,
  customTitle = 'Coin Image Analysis',
}) => {
  const { isDark } = useTheme();

  // Local tick for elapsed time so seconds advance smoothly each second
  const [localElapsed, setLocalElapsed] = useState(progressState?.elapsedSeconds || 0);

  useEffect(() => {
    setLocalElapsed(progressState?.elapsedSeconds || 0);
  }, [progressState?.elapsedSeconds]);

  useEffect(() => {
    if (!progressState || progressState.status !== 'processing') return;

    const timer = setInterval(() => {
      setLocalElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [progressState?.status]);

  if (!progressState) return null;

  const {
    stage = 'preparing_image',
    stageName,
    progress = 0,
    status = 'processing',
    estimatedRemainingSeconds = 0,
    hasHistoricalData = false,
    message = 'Please wait while we analyze your coin...',
    error = null,
    timing = null,
  } = progressState;

  // Determine current stage index in STAGE_ORDER
  let currentStageIndex = STAGE_ORDER.findIndex((s) => s.id === stage);
  if (currentStageIndex === -1) {
    // If completed or failed
    if (status === 'completed') currentStageIndex = STAGE_ORDER.length - 1;
    else currentStageIndex = 0;
  }

  const isFailed = status === 'failed';
  const isCompleted = status === 'completed';

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 shadow-lg overflow-hidden ${
        isDark
          ? 'bg-dark-800/90 border-gold-500/30 shadow-black/40'
          : 'bg-white border-gold-500/30 shadow-gold/10'
      }`}
    >
      {/* Top Banner / Header */}
      <div
        className={`px-6 py-4 border-b flex items-center justify-between ${
          isDark
            ? 'bg-gradient-to-r from-dark-800 via-dark-700/60 to-dark-800 border-dark-700'
            : 'bg-gradient-to-r from-[#FAF8F5] via-[#FFFDF9] to-[#FAF8F5] border-gray-100'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
              isCompleted
                ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                : isFailed
                ? 'bg-red-500/20 text-red-500 border border-red-500/30'
                : 'bg-gold-500/20 text-gold-500 border border-gold-500/30'
            }`}
          >
            {isCompleted ? (
              <FiCheckCircle className="w-5 h-5 animate-bounce" />
            ) : isFailed ? (
              <FiAlertCircle className="w-5 h-5" />
            ) : (
              <FiCpu className="w-5 h-5 animate-pulse" />
            )}
          </div>
          <div>
            <h3
              className={`font-serif font-bold text-base sm:text-lg flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              [{customTitle}]
            </h3>
            <p className="text-xs text-gold-500 font-medium">
              Powered by Google Gemini 3.8 Flash Vision
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div>
          {isCompleted && (
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
              Completed
            </span>
          )}
          {isFailed && (
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-500/15 text-red-500 border border-red-500/30">
              Failed
            </span>
          )}
          {!isCompleted && !isFailed && (
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gold-500/15 text-gold-500 border border-gold-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gold-500 animate-ping"></span>
              Live Analysis
            </span>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Animated Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Progress: <span className="font-bold text-gold-500 font-mono text-base">{progress}%</span>
            </span>
            <span className="text-xs text-gray-500 font-mono">
              Stage {Math.min(currentStageIndex + 1, STAGE_ORDER.length)} of {STAGE_ORDER.length}
            </span>
          </div>

          <div
            className={`w-full h-3 rounded-full overflow-hidden relative ${
              isDark ? 'bg-dark-700' : 'bg-gray-100'
            }`}
          >
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out relative ${
                isFailed
                  ? 'bg-red-500'
                  : isCompleted
                  ? 'bg-emerald-500'
                  : 'bg-gradient-to-r from-gold-600 via-gold-500 to-gold-400'
              }`}
              style={{ width: `${Math.max(5, Math.min(100, progress))}%` }}
            >
              {!isCompleted && !isFailed && (
                <div className="absolute inset-0 bg-white/20 animate-[pulse_1.5s_infinite]"></div>
              )}
            </div>
          </div>
        </div>

        {/* 10 Analysis Stages Check-list */}
        <div
          className={`rounded-xl p-4 border space-y-2.5 ${
            isDark ? 'bg-dark-900/50 border-dark-700' : 'bg-[#FAF8F5]/70 border-gray-100'
          }`}
        >
          {STAGE_ORDER.map((item, idx) => {
            const isDone = isCompleted || idx < currentStageIndex;
            const isCurrent = !isCompleted && !isFailed && idx === currentStageIndex;
            const isPending = !isCompleted && idx > currentStageIndex;

            return (
              <div
                key={item.id}
                className={`flex items-center justify-between text-xs sm:text-sm py-1 px-2 rounded-lg transition-colors ${
                  isCurrent
                    ? isDark
                      ? 'bg-gold-500/10 text-gold-400 font-semibold'
                      : 'bg-gold-500/10 text-gold-700 font-semibold'
                    : isDone
                    ? isDark
                      ? 'text-gray-300'
                      : 'text-gray-700'
                    : 'text-gray-400 dark:text-gray-600'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="w-5 text-center font-mono text-[11px] opacity-60">
                    {idx + 1}.
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center justify-center w-6 text-center">
                  {isDone && (
                    <span className="text-emerald-500 font-bold text-sm">
                      <FiCheck className="stroke-[3]" />
                    </span>
                  )}
                  {isCurrent && (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gold-500"></span>
                    </span>
                  )}
                  {isPending && (
                    <span className="text-gray-400 dark:text-gray-600 text-xs">○</span>
                  )}
                  {isFailed && idx === currentStageIndex && (
                    <span className="text-red-500 font-bold text-sm">✕</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Timers & Dynamic Remaining Time */}
        <div
          className={`grid grid-cols-2 gap-4 p-4 rounded-xl border ${
            isDark ? 'bg-dark-750 border-dark-700' : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gold-500/15 flex items-center justify-center text-gold-500">
              <FiClock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">
                Elapsed Time
              </p>
              <p
                className={`font-mono font-bold text-base sm:text-lg ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                {formatTime(localElapsed)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-500">
              <FiZap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold flex items-center gap-1">
                Estimated Remaining
                {!hasHistoricalData && !isCompleted && (
                  <span className="text-[9px] text-amber-500 lowercase font-normal">
                    (approximate)
                  </span>
                )}
              </p>
              <p
                className={`font-mono font-bold text-base sm:text-lg ${
                  isCompleted
                    ? 'text-emerald-500'
                    : isDark
                    ? 'text-white'
                    : 'text-gray-900'
                }`}
              >
                {isCompleted ? '00:00' : formatTime(estimatedRemainingSeconds)}
              </p>
            </div>
          </div>
        </div>

        {/* Message / Status Note */}
        <div className="text-center">
          <p
            className={`text-xs sm:text-sm font-medium ${
              isFailed
                ? 'text-red-500 font-bold'
                : isCompleted
                ? 'text-emerald-500 font-semibold'
                : isDark
                ? 'text-gray-300'
                : 'text-gray-600'
            }`}
          >
            {isFailed
              ? `Analysis Failed: ${error || message}`
              : message || 'Please wait while we analyze your coin...'}
          </p>
        </div>

        {/* Completed Performance Summary */}
        {isCompleted && timing && (
          <div
            className={`text-xs p-3.5 rounded-xl border space-y-1 font-mono ${
              isDark ? 'bg-dark-900/40 border-dark-700 text-gray-400' : 'bg-gray-100/70 border-gray-200 text-gray-600'
            }`}
          >
            <div className="flex justify-between font-semibold text-gold-500 pb-1 border-b border-gray-700/30">
              <span>Performance Breakdown</span>
              <span>Total: {(timing.totalDurationMs / 1000).toFixed(2)}s</span>
            </div>
            {timing.imagePreparationMs > 0 && (
              <div className="flex justify-between">
                <span>Image Prep & Optimization:</span>
                <span>{timing.imagePreparationMs}ms</span>
              </div>
            )}
            {timing.geminiApiResponseMs > 0 && (
              <div className="flex justify-between">
                <span>Gemini API Response:</span>
                <span>{timing.geminiApiResponseMs}ms</span>
              </div>
            )}
            {timing.validationMs > 0 && (
              <div className="flex justify-between">
                <span>Validation & Entity Match:</span>
                <span>{timing.validationMs}ms</span>
              </div>
            )}
            {timing.databaseSaveMs > 0 && (
              <div className="flex justify-between">
                <span>Database Save:</span>
                <span>{timing.databaseSaveMs}ms</span>
              </div>
            )}
          </div>
        )}

        {/* Failed Action Bar */}
        {isFailed && (
          <div className="flex items-center justify-center gap-3 pt-2">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-white font-medium text-sm transition-colors shadow-gold"
              >
                <FiRefreshCw className="w-4 h-4" />
                Retry Analysis
              </button>
            )}
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                  isDark
                    ? 'border-dark-600 text-gray-300 hover:bg-dark-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Dismiss
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoinAnalysisProgress;
