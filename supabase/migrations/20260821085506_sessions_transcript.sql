-- AI 튜터/롤플레잉 세션 종료 시 대화 전체(퀴즈 응답, TTS용 dialogueText, 발음점수
-- 포함)를 그대로 남겨서, 세션 상세 페이지에서 채팅 UI를 그대로 재현할 수 있게 함.
-- 이전에는 요약(til/memo)만 저장되고 실제 메시지는 버려졌음. null이면 텍스트
-- 기반으로 직접 남긴 세션(공부기록 등)이거나, 이 컬럼 도입 이전 세션.
alter table sessions add column if not exists transcript jsonb;
