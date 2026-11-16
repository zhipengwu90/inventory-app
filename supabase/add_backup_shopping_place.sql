-- Optional second shopping place per item, for when the usual place is sold out
-- or stops carrying it. The shopping list shows "May need to check at <place>".
-- Same rules as shopping_place_id: must belong to the item's store, and is
-- cleared if that shopping place is deleted.
--
-- Run with search_path set to the target schema, e.g.
--   set search_path = dev;    -- local testing
--   set search_path = public; -- production
alter table item_list_v2
  add column if not exists backup_shopping_place_id bigint;

alter table item_list_v2
  drop constraint if exists item_list_v2_backup_shopping_place_fkey;
alter table item_list_v2
  add constraint item_list_v2_backup_shopping_place_fkey
  foreign key (backup_shopping_place_id, store_id)
  references shopping_places (id, store_id)
  on delete set null (backup_shopping_place_id);

notify pgrst, 'reload schema';
