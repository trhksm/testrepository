n = 20 #サンプル数
fp = open("r4-2-1.txt", mode = "w") #出力先
fp.write("0 0\n") #始端点
n.times{|i|
  x = (i + 1) / n.to_f
  y = 90 * (1 - Math.cos(Math::PI * (i + 1) / n.to_f)).to_f #cosカーブ
  fp.write(sprintf("%f %f\n",x,y))
}
fp.close
#gnuplotで保存
ret = `gnuplot -e "
set terminal svg;
set output 'r4-2-1.svg';
set grid;
plot 'r4-2-1.txt' w lp"`