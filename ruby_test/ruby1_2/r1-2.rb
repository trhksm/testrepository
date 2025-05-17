#csvデータの読み込み
data=[]
fp = open("sales_ticket.csv")
fp.each{|line|
  line.chomp!
  data.push(line.split(","))
}
fp.close

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
#ファイル作成
ret = `echo > result.txt`
#書き出し
aa.keys.each{|key|
  ret = `echo "#{sprintf("%-20s : %8d",key,aa[key])}" >> result.txt`
}