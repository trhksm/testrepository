n = 20 #サンプル数
num = n - 2 #原点除いたサンプル数
fp = open("r4-2-2.txt", mode = "w")
fp.write("0 0\n") #始端点
num.times{|i|
  x = (i + 1) / n.to_f
  y = (180.0 / (1 + Math::exp(-13 * (i - 9) / n.to_f))).to_f #gain = 13 #シグモイト関数
  fp.write(sprintf("%f %f\n",x,y))
}
fp.write("1 180\n") #終端点
fp.close
#gnuplotで出力
ret = `gnuplot -e "set terminal svg;
set output 'r4-2-2.svg';
set grid;
plot 'r4-2-2.txt' w lp"`