-- Internal SQL schedule: no HTTP credential or service key is stored in Cron.
create extension if not exists pg_cron;
select cron.schedule('wolfcue-expire-waiting','* * * * *',$$select wolfcue_private.expire_rooms();$$);
