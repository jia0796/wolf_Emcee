-- AKW only: append a validated board; never alter existing rooms, assignments, RLS or 27 prior catalogue rows.
do $$ begin
 if exists(select 1 from wolfcue_private.boards where id='awakenedKingWitch12' and (capacity<>12 or roles<>ARRAY['awakenedKing','wolf','wolf','wolf','awakenedWitch','seer','guard','hunter','villager','villager','villager','villager']::text[] or catalog_hash<>'6bdd990146c8000f2337ba4771ac66771ebfa2816203ef942786a088054795bb')) then raise exception 'AKW catalogue mismatch'; end if;
end $$;
insert into wolfcue_private.boards(id,capacity,roles,catalog_hash) values('awakenedKingWitch12',12,ARRAY['awakenedKing','wolf','wolf','wolf','awakenedWitch','seer','guard','hunter','villager','villager','villager','villager']::text[],'6bdd990146c8000f2337ba4771ac66771ebfa2816203ef942786a088054795bb') on conflict(id) do nothing;
