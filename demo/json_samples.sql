-- https://www.postgresql.org/docs/9.5/functions-json.html
-- https://www.postgresql.org/docs/current/arrays.html

update person set details = details || 
jsonb_build_object('qualifications', 
jsonb_build_object('aws', jsonb_build_object('architect', true)))
where id =1;

update person set details = details || 
jsonb_build_object('languages', array['English', 'Portuguese', 'Polish'])
where id = 1;

select details #> '{qualifications,aws}' from person where id = 1; -- {"architect": true}

select * from person where details ? 'qualifications';

-- ?| do any of these array strings exist as top-level keys?
select * from person where details ?| array['qualifications', 'languages', 'someOtherKey'];

-- ?& do all of these array strings exist as top-level keys?
select * from person where details ?& array['qualifications', 'firstName', 'lastName'];

select details - 'languages' - 'qualifications' from person where id = 1;

-- Delete the array element with specified index
select jsonb_build_array('Polish', 'Spanish') - 0;

-- 	Delete the field or element with specified path
select '["a", {"b":1}]'::jsonb #- '{1,b}'; -- ["a", {}]

select json_object('{{a, 1},{b, "def"},{c, 3.5}}'); -- {"a": "1", "b": "def", "c": "3.5"}

select jsonb_array_length(details->'languages') from person where details ? 'languages';

select jsonb_each(details) from person where id = 1; -- one row per top level key

select keys.key, keys.value from person, lateral jsonb_each(details) as keys where id = 1;

select jsonb_extract_path(details, 'qualifications') from person where id = 1;

select jsonb_object_keys(details) from person where id = 1;

select jsonb_array_elements(details->'languages') from person where id = 1;

select json_typeof('-123.4'); -- number

select jsonb_pretty(details) from person where id = 1;

select 
    details->'qualifications'->'aws', 
    jsonb_set(details, '{qualifications, aws, architect}'::text[], 'false')->'qualifications'->'aws'
from person where id = 1;

select json_strip_nulls('[{"f1":1,"f2":null},2,null,3]');

SELECT array_prepend(1, ARRAY[2,3]);

select array_append(ARRAY[1,2], 3);

SELECT array_remove(ARRAY['sun','mon','tue','wed','thu','fri','sat'], 'mon');

select array_cat(ARRAY[1,2], ARRAY[3,4]);

SELECT array_position(ARRAY['sun','mon','tue','wed','thu','fri','sat'], 'mon');

