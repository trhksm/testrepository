data = [["2020-11-23","book",1000],["2020-11-25","taxi",2000],["2020-12-25","kosai",3000],["2019-12-01","book",4000]]
#月毎
month = {}
data.size.times{|i|
  if month.has_key?(data[i][0].slice(0..6)) then
    month["#{data[i][0].slice(0..6)}"] += data[i][2]
  else
    month["#{data[i][0].slice(0..6)}"] = data[i][2]
  end
}

#科目
subject = {}
data.size.times{|i|
  if subject.has_key?(data[i][1]) then
    subject["#{data[i][1]}"] += data[i][2]
  else
    subject["#{data[i][1]}"] = data[i][2]
  end
}

#月＋科目
month_subject = {}
data.size.times{|i|
  if month_subject.has_key?(data[i][0].slice(0..6)) then
    if month_subject["#{data[i][0].slice(0..6)}"].has_key?(data[i][1])
      month_subject["#{data[i][0].slice(0..6)}"]["#{data[i][1]}"] += data[i][2]
    else
      month_subject["#{data[i][0].slice(0..6)}"]["#{data[i][1]}"] = data[i][2]
    end
  else
    month_subject["#{data[i][0].slice(0..6)}"] = {"#{data[i][1]}" => data[i][2]}
  end
}
p month
p subject
p month_subject