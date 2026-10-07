-- Keep this corrective migration after campaign_002: existing environments may
-- already have the original A/B constraint applied.
alter table campaign.quiz_answers
  drop constraint if exists quiz_answers_selected_option_check;

alter table campaign.quiz_answers
  add constraint quiz_answers_selected_option_check
  check (selected_option in ('A', 'B', 'C'));

comment on column campaign.quiz_answers.selected_option is
  'The selected published option key. Only A, B, or C is valid.';
