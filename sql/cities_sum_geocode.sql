use refugees;
select city, `sum`, lat, lng 
from (
	select concat(city, ", ", state) city1 , sum(total_per_state_city) `sum` from arrivalsall group by city
) as a
inner join (
	select * from geocoded_cities
) b 
on b.city = a.city1
order by `sum` desc
limit 0, 5000;
    
    