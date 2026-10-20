create index player_roles_deal on wolfcue_private.player_roles(deal_id);
create index room_seats_capacity on wolfcue_private.room_seats(room_id,capacity);
create index room_seats_user on wolfcue_private.room_seats(user_id);
create index rooms_board on wolfcue_private.rooms(board_id);
revoke all on schema cron from public,anon,authenticated;
revoke all on all tables in schema cron from public,anon,authenticated;
revoke all on all functions in schema cron from public,anon,authenticated;
