create table person (
    id bigint generated always as identity, 
    primary key(id),
    details jsonb not null
);

create or replace function random_string(length integer) returns text as $$
declare 
    chars text[] := '{0,1,2,3,4,5,6,7,8,9,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z}';
    result text := '';

begin
    if length < 0 then
        raise exception 'Length cannot be 0';
    end if;

    for i in 1..length loop
        result := result || chars[1+random()*(array_length(chars, 1)-1)];
  end loop;
    return result;
end;
$$ language plpgsql;

insert into person (details)
select jsonb_build_object('firstName', random_string(20), 'lastName', random_string(20))
from generate_series(1, 1000000);

select count(id) from person;

CREATE INDEX idxginpersondetails ON person USING gin (details jsonb_path_ops);

explain select * from person where details @> jsonb_build_object('firstName', 'Gary');

-- this query will not use any index
explain select * from person where details::text ->>'firstName' like '%test%';

-- workaround is to use a trigram index
CREATE EXTENSION pg_trgm;
CREATE INDEX if not exists trgm_idx_person_details ON person USING gin (((details)::text) gin_trgm_ops);

explain select * from person where details::text like '%test%';