-- sessions had two schemas mixed together: duration/duration_minutes and
-- memo/notes. The manual "공부 기록 추가" flow and the session detail page
-- both use duration_minutes; AI 튜터 세션 저장(useTutorSession.ts)만 별도로
-- duration/memo에 썼던 탓에 그 세션들은 상세 페이지에서 학습 시간이 안 뜨고
-- 있었음. memo/notes 둘 다 어디서도 읽히지 않는 죽은 컬럼이라 memo만 정리.
-- notes는 공유 Session 타입에 남아있는 정식 필드라 유지.
update sessions set duration_minutes = duration where duration_minutes is null and duration is not null;
alter table sessions drop column if exists duration;
alter table sessions drop column if exists memo;
