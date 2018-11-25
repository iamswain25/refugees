select LOCAL_AFFILIATE, replace(LOCAL_AFFILIATE, "�", "" )
from agencies
where instr(LOCAL_AFFILIATE, "�") > 0;

update agencies 
set LOCAL_AFFILIATE = replace(LOCAL_AFFILIATE, "�", "" ) 
where instr(LOCAL_AFFILIATE, "�") > 0;

select count(id) from (select ID, LOCAL_AFFILIATE, formatted_address, latitude, longitude  from agencies group by google_place_id) t1;
select ID, LOCAL_AFFILIATE, formatted_address, latitude, longitude
from agencies group by google_place_id order by id;
select * from agencies;