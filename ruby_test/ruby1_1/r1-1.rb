data = [["2020-11-23","book",1000],["2020-11-25","taxi",2000],["2020-12-25","kosai",3000],["2019-12-01","book",4000]]
aa = {}
# month
data.each{|a|
  d = a[0][0,6];yen = a[2];key = d #ここだけ違う
  aa[key] = 0 if aa.has_key?(key) == false
  aa[key] += yen.to_i
}
# subject
data.each{|a|
  s = a[1];yen = a[2];key = s #ここだけ違う
  aa[key] = 0 if aa.has_key?(key) == false
  aa[key] += yen.to_i
}
# month + subject
data.each{|a|
  d = a[0][0,6];s = a[1];yen = a[2];key = d +"_"+ s #ここだけ違う
  aa[key] = 0 if aa.has_key?(key) == false
  aa[key] += yen.to_i
}

aa.keys.each{|key|
  p sprintf("%-20s : %8d",key,aa[key])
}
