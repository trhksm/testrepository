require "date"
today = Date.today
first = Date.new(2025, 4, 4)
p sprintf("%s から %s までの暦日数は %d日",first,today,today - first)
