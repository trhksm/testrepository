n = 20 #サンプル数
fp = open("r4-1.txt","w") #出力先
fp.write("0 0\n")
n.times{|i|
x = (i + 1 ) / n.to_f
y = (i + 1) * 180 / n.to_f #直線
fp.write(sprintf("%f %f\n",x,y))
}
fp.close
#gnuplotで保存
ret = `gnuplot -e "
set terminal svg;
set output 'r4-1.svg';
plot 'r4-1.txt' w lp"`