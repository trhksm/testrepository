file = "kinmu_ueno2025_03Mar_txt.txt"
s = 0
fp = open(file)
fp.each{|l|
  l.chomp!
  a = l.split(" ")
  if a[0].include?("#") == false
    t1 = a[1].split(":") #開始時間
    t2 = a[2].split(":") #終了時間
    dh = t2[0].to_i - t1[0].to_i  #差時間
    dm = t2[1].to_i - t1[1].to_i  #差分
    s += (60 * dh + dm) * a[3].to_i / 100 #稼働率
  end
}
fp.close
f = file.split("_")
name = f[1].gsub(/[0123456789]/,"") #年削除
year = f[1].gsub(/#{name}/,"") #name削除
month = f[2][0,2]
p sprintf("%s %s-%s %dh %dmin", name, year, month, s / 60, s % 60)
