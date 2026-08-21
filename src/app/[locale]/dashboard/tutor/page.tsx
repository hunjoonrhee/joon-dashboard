'use client';

import { getLanguageCode } from '@/lib/language-codes';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import SaveTranscriptModal from './components/SaveTranscriptModal';
import TutorChat from './components/TutorChat';
import TutorCodeReview from './components/TutorCodeReview';
import TutorComplete from './components/TutorComplete';
import TutorGate from './components/TutorGate';
import TutorHeader from './components/TutorHeader';
import TutorInput from './components/TutorInput';
import TutorSidePanel from './components/TutorSidePanel';
import { type SavedRecord, useTutorSession } from './hooks/useTutorSession';
import { loadUserContext, type UserContext } from './hooks/useUserContext';

type PageState = 'loading' | 'session' | 'gate' | 'complete';

export default function TutorPage() {
  const searchParams = useSearchParams();
  const topic = searchParams.get('topic') ?? '';
  const isGate = searchParams.get('gate') === 'true';
  const languageOverride = searchParams.get('lang');

  const [pageState, setPageState] = useState<PageState>(isGate ? 'gate' : 'loading');
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [savedRecord, setSavedRecord] = useState<SavedRecord | null>(null);
  const [codeReviewMode, setCodeReviewMode] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  useEffect(() => {
    if (isGate || !topic) return;
    loadUserContext(topic, languageOverride).then((ctx) => {
      setUserContext(ctx);
      setPageState('session');
    });
  }, [topic, isGate, languageOverride]);

  const {
    messages,
    loading,
    isEndingSession,
    elapsedMin,
    sessionSummary,
    lastError,
    handleRetry,
    handleSend,
    handleCodeReviewSubmit,
    handleQuizSelect,
    handleEndSession,
  } = useTutorSession({
    topic,
    userContext,
    onComplete: (record) => {
      setSavedRecord(record);
      setPageState('complete');
    },
  });

  const onCodeReviewSubmit = (code: string) => {
    handleCodeReviewSubmit(code);
    setCodeReviewMode(false);
  };

  const onChooseSaveTranscript = (saveTranscript: boolean) => {
    setShowSaveConfirm(false);
    handleEndSession(saveTranscript);
  };

  const languageCode = getLanguageCode(userContext?.targetLanguage ?? null);

  if (pageState === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-pri border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-ink-faint">준비 중...</p>
        </div>
      </main>
    );
  }

  if (pageState === 'gate') return <TutorGate />;
  if (pageState === 'complete') return <TutorComplete savedRecord={savedRecord} />;

  return (
    <main className="flex flex-col h-[calc(100vh-57px)]">
      <TutorHeader
        topic={topic}
        elapsedMin={elapsedMin}
        isEndingSession={isEndingSession}
        loading={loading}
        onEndSession={() => setShowSaveConfirm(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <TutorChat
            messages={messages}
            loading={loading}
            isEndingSession={isEndingSession}
            lastError={lastError}
            languageCode={languageCode}
            onQuizSelect={handleQuizSelect}
            onRetry={handleRetry}
          />

          {codeReviewMode ? (
            <TutorCodeReview loading={loading} onSubmit={onCodeReviewSubmit} onClose={() => setCodeReviewMode(false)} />
          ) : (
            <TutorInput
              loading={loading}
              isEndingSession={isEndingSession}
              languageCode={languageCode}
              onSend={handleSend}
              onCodeReviewOpen={() => setCodeReviewMode(true)}
            />
          )}
        </div>

        <TutorSidePanel
          topic={topic}
          messages={messages}
          userContext={userContext}
          sessionSummary={sessionSummary}
          isEndingSession={isEndingSession}
          loading={loading}
          onEndSession={() => setShowSaveConfirm(true)}
        />
      </div>

      {showSaveConfirm && <SaveTranscriptModal onChoose={onChooseSaveTranscript} />}
    </main>
  );
}
