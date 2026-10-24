-- Append only the approved AWB board. Existing rooms, assignments, grants and 26 board rows remain unchanged.
do $$ begin
 if exists(select 1 from wolfcue_private.boards where id='awakenedBeauty12' and (capacity<>12 or roles<>ARRAY['awakenedBeauty','wolf','wolf','wolf','seer','witch','guard','awakenedHunter','villager','villager','villager','villager']::text[])) then raise exception 'AWB catalogue mismatch'; end if;
end $$;
insert into wolfcue_private.boards(id,capacity,roles,catalog_hash) values('awakenedBeauty12',12,ARRAY['awakenedBeauty','wolf','wolf','wolf','seer','witch','guard','awakenedHunter','villager','villager','villager','villager']::text[],'2ad4285d7dad6647cab8122b0be5d6d1ba75b240f0da0f9046c910f9fc3d7e27') on conflict(id) do nothing;
