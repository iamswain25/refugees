update agencies 
set LOCAL_AFFILIATE = replace(LOCAL_AFFILIATE, "�", "" ) 
where instr(LOCAL_AFFILIATE, "�") > 0;

select id
from agencies
where instr(LOCAL_AFFILIATE, "�") > 0;

select replace(LOCAL_AFFILIATE, "�", "" )
from agencies
where instr(LOCAL_AFFILIATE, "�") > 0;